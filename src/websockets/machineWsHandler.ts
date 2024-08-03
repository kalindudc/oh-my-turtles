import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { faker, th } from '@faker-js/faker';
import path from 'path';

import { ClientWebSocket, MachineWebSocket, Message, WebSocketHandler } from './wsHandler';
import { addWorld, getWorld, World } from '../models/world';
import { getMachine, addMachine, Machine, Turtle } from '../models/machine';
import createTaggedLogger from '../logger/logger';
import { log } from 'console';
import { ClientWebSocketHandler } from './clientWsHandler';
import { Commands as wsCommands } from './socketsHelper';

const logger = createTaggedLogger(path.basename(__filename));

export type MachineType = {
  id: string;
  name: string;
  type: string;
  world_id: string;
  connected: boolean;
}

export const MACHINE_API_KEY = process.env.MACHINE_API_KEY

export class MachineWebSocketHandler implements WebSocketHandler {

  machines: {[key: string]: MachineWebSocket};
  uninitiatedMachines:{[key: string]: MachineWebSocket};
  constructor() {
    this.machines = {};
    this.uninitiatedMachines = {};
  }

  registerUninitiated(ws: MachineWebSocket, payload: Message) : string | null {
    if (!payload.id) {
      logger.info(`Uninitiated machine id not provided`);
      return wsCommands.pass;
    }

    ws.id = payload.id;
    if (payload.payload) {
      ws.type = payload.payload.type;
    }
    this.uninitiatedMachines[payload.id] = ws;
    logger.info(`Uninitiated machine registered`);
    return wsCommands.sync_uninitiated_machines_with_clients;
  }

  unregisterUninitiated(ws: MachineWebSocket) : string | null {
    const id : string | undefined = Object.keys(this.uninitiatedMachines).find(key => this.uninitiatedMachines[key] === ws)
    if (!id) {
      return wsCommands.pass;
    }

    delete this.uninitiatedMachines[id];
    logger.info(`Uninitiated machine unregistered`);
    return wsCommands.sync_uninitiated_machines_with_clients;
  }

  parsePayload(id: string, payload: any): Machine | null {
    if (payload.type === 'turtle') {
      return new Turtle(id, faker.person.firstName(), 0, 0, 0, payload.worldId, payload.fuel ? payload.fuel : 0, payload.inventory ? payload.inventory : []);
    }
    return null;
  }

  async register(ws: MachineWebSocket, message: Message) {
    const id = message.id;
    const payload = message.payload;

    if (!payload.type || !payload.worldId) {
      // Invalid payload
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
      return wsCommands.pass;
    }

    var world = await getWorld(payload.worldId);
    if (!world) {
      // world does not exist, register it
      logger.info(`New world added to db with id: ${payload.worldId}`);
      world = await addWorld({ id: payload.worldId, name: payload.worldId, blocks: [] });
    }

    const newId : string = id? id : randomUUID();
    const machineData = this.parsePayload(newId, payload);
    if (!machineData) {
      // Invalid payload
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid machine type' }));
      return wsCommands.pass;
    }

    var machine = await getMachine(newId);
    if (!machine) {
      await addMachine(machineData);
      machine = machineData;
      logger.info(`New machine added to db with id: ${id}`);
    }

    ws.id = machine.id;
    ws.type = machine.type;
    this.machines[machine.id] = ws;
    ws.send(JSON.stringify({ type: 'register', id: machine.id, name: machine.name }));
    logger.info(`Machine registered with id: ${id}, machine count: ${Object.keys(this.machines).length}`);
    return wsCommands.sync_machines_with_clients;
  }

  unregister(ws: MachineWebSocket) {
    const id : string | undefined = Object.keys(this.machines).find(key => this.machines[key] === ws)
    if (!id) {
      return wsCommands.pass;
    }

    delete this.machines[id];
    logger.info(`Machine unregistered`);
    return wsCommands.sync_machines_with_clients;
  }

  data(ws: MachineWebSocket, message: Message, clientHandler: ClientWebSocketHandler) {
    const payload = message.payload
    if (!payload) {
      logger.info("Invalid payload, nothing to process.")
      return wsCommands.pass;
    }
    logger.info(`Received data from ${ws.type} with id ${ws.id}: ${message.payload}`);
    return wsCommands.pass;
  }

  acceptMachine(id: string) : string | null {
    if (!this.uninitiatedMachines[id]) {
      logger.info(`Machine ${id} does not exist in uninitiated machines`);
      return wsCommands.pass;
    }

    if (!MACHINE_API_KEY) {
      logger.error('Machine API key not set');
      return wsCommands.pass;
    }

    const ws = this.uninitiatedMachines[id];
    ws.send(MACHINE_API_KEY);
    delete this.uninitiatedMachines[id];
    logger.info(`Machine ${id} accepted`);
    return wsCommands.sync_uninitiated_machines_with_clients
  }

  rejectMachine(id: string) {
    if (!this.uninitiatedMachines[id]) {
      logger.info(`Machine ${id} does not exist in uninitiated machines`);
      return wsCommands.pass;
    }

    const ws = this.uninitiatedMachines[id];
    ws.send("REJECTED");
    delete this.uninitiatedMachines[id];
    logger.info(`Machine ${id} rejected`);
    return wsCommands.sync_uninitiated_machines_with_clients
  }
};
