import path from 'path';
import { Mutex } from 'async-mutex';

import createTaggedLogger from '../logger/logger';
import { getMachines, Machine } from '../models/machine';
import { getWorlds } from '../models/world';
import { MachineWebSocketHandler } from './machineWsHandler';
import { ClientCommands as Commands, sendMessage, Commands as wsCommands } from '../util/socketsHelper';
import { ClientWebSocket, MachineWebSocket, Message, WebSocketHandler } from './wsHandler';

const logger = createTaggedLogger(path.basename(__filename));
const API_KEYS : Array<{apiKey: string, username: string}> = []

export const addApiKey = (apiKey: string, username: string) => {
  API_KEYS.push({apiKey, username});
  logger.info(`API successfully added for user: ${username}`);
}

export const getApiKey = (username: string) => {
  const key = API_KEYS.find((k) => k.username === username);
  return key ? key.apiKey : null;
}

export const removeApiKey = (username: string) => {
  const index = API_KEYS.findIndex((k) => k.username === username);
  if (index !== -1) {
    API_KEYS.splice(index, 1);
  }
}

export const getUserName = (apiKey: string) => {
  const key = API_KEYS.find((k) => k.apiKey === apiKey);
  return key ? key.username : null;
}

export const isClientAuthorized = (apiKey: string | undefined) => {
  if (!apiKey) {
    return false;
  }

  return API_KEYS.map((k) => k.apiKey).includes(apiKey)
}

export class ClientWebSocketHandler implements WebSocketHandler {

  clients: { [key: string]: ClientWebSocket };
  clientsMutex: Mutex;
  constructor() {
    this.clients = {};
    this.clientsMutex = new Mutex();
  }

  async register(ws: ClientWebSocket, message: Message) {
    if (!message.id) {
      logger.error(`Client id not provided, ignoring...`);
      return wsCommands.pass;
    }

    ws.username = message.id;
    await this.clientsMutex.runExclusive(async () => {
      if (message.id){
        this.clients[message.id] = ws;
      }
      return;
    });

    logger.info(`Client registered with id: ${message.id}`);
    sendMessage(ws, JSON.stringify({ type: 'register', id: message.id }), logger);
    return wsCommands.sync_machines_with_current_client;
  }

  async unregister(ws: ClientWebSocket) {
    const id : string | undefined = Object.keys(this.clients).find(key => this.clients[key] === ws)
    if (!id) {
      return wsCommands.pass;
    }

    await this.clientsMutex.runExclusive(async () => {
      delete this.clients[id];
      return;
    });
    logger.info(`Client ${id} unregistered`);
    return wsCommands.pass;
  }

  async data(ws: ClientWebSocket, message: Message, machineHandler: MachineWebSocketHandler) {
    if (!message.api_key) {
      logger.error(`API key not provided this should not happen...`);
      return wsCommands.pass;
    }

    const username = getUserName(message.api_key);
    const payload = message.payload;
    if (!payload) {
      logger.error(`Received data from ${ws.username} with no payload`);
      return wsCommands.pass;
    }

    logger.info(`Processing data from ${username}: ${payload}`);

    const command = payload.command;
    if (!command) {
      logger.info(`No command provided, ignoring...`);
      return wsCommands.pass;
    }
    return await this.processCommand(command, ws, username, payload, machineHandler);
  }

  async processCommand(command: string, ws: ClientWebSocket, username: string | null, payload: any, machineHandler: MachineWebSocketHandler) : Promise<string> {
    let newCommand : string | null = wsCommands.pass;

    switch (command) {
      case Commands.initiate_accept_machine:
        newCommand = await machineHandler.acceptMachine(payload.machine_id, payload.data, ws);
        logger.info(`Machine ${payload.machine_id} accepted by ${username}`);
        return newCommand;

      case Commands.initiate_reject_machine:
        newCommand = await machineHandler.rejectMachine(payload.machine_id);
        logger.info(`Machine ${payload.machine_id} rejected by ${username}`);
        return newCommand;

      case Commands.forward:
      case Commands.backward:
      case Commands.left:
      case Commands.right:
      case Commands.up:
      case Commands.down:
      case Commands.inspect:
      case Commands.inspect_up:
      case Commands.inspect_down:
        newCommand = machineHandler.sendCommand(payload.machine_id, command, username);
        logger.info(`Command ${command} sent to machine ${payload.machine_id} by ${username}`);
        return newCommand;
      default:
        logger.error(`Unknown command: ${command}`);
        return newCommand;
    }
  }

  syncMachinesWithClient(ws: ClientWebSocket, machines: {[key: string]: MachineWebSocket}) {
    getMachines().then((machinesFromDb) => {
      const updatedMachines : Array<Machine> = machinesFromDb.map((machine: any) => {
        return {
          id: machine.id,
          computer_id: machine.computer_id,
          name: machine.name,
          type: machine.type,
          connected: machine.id in machines,
          x: machine.x,
          y: machine.y,
          z: machine.z,
          fuel: machine.fuel,
          facing: machine.facing,
          inventory: machine.inventory,
          world_id: machine.world_id
        };
      });
      sendMessage(ws, JSON.stringify({ type: 'sync_machines', machines: updatedMachines }), logger);
    });
  }

  syncMachinesWithClients(machines: {[key: string]: MachineWebSocket}) {
    getMachines().then((machinesFromDb) => {
      const updatedMachines : Array<Machine> = machinesFromDb.map((machine: any) => {
        return {
          id: machine.id,
          computer_id: machine.computer_id,
          name: machine.name,
          type: machine.type,
          connected: machine.id in machines,
          x: machine.x,
          y: machine.y,
          z: machine.z,
          fuel: machine.fuel,
          facing: machine.facing,
          inventory: machine.inventory,
          world_id: machine.world_id
        };
      });
      Object.keys(this.clients).forEach((key) => {
        sendMessage(this.clients[key], JSON.stringify({ type: 'sync_machines', machines: updatedMachines }), logger);
      });
    });
  }

  syncUninitiatedMachinesWithClients(machines: {[key: string]: MachineWebSocket}) {
    const uninitiatedMachines = Object.keys(machines).map((key) => {
      return { id: key, type: machines[key].type };
    });

    Object.keys(this.clients).forEach((key) => {
      sendMessage(this.clients[key], JSON.stringify({ type: 'sync_uninitiated', machines: uninitiatedMachines }), logger);
    });
  }

  syncWorldsWithClients() {
    getWorlds().then((worlds) => {
      Object.keys(this.clients).forEach((key) => {
        sendMessage(this.clients[key], JSON.stringify({ type: 'sync_worlds', worlds: worlds }), logger);
      });
    });
  }
};
