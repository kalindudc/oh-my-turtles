import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { faker, th } from '@faker-js/faker';
import path from 'path';

import { ClientWebSocket, MachineWebSocket, Message, WebSocketHandler } from './wsHandler';
import { addWorld, getWorld, World } from '../models/world';
import { getMachine, addMachine, Machine, Turtle, updateMachine, Direction, moveBackward, moveDown, moveForward, moveUp, turnLeft, turnRight } from '../models/machine';
import createTaggedLogger from '../logger/logger';
import { log } from 'console';
import { ClientWebSocketHandler } from './clientWsHandler';
import { Commands as wsCommands, ClientCommands, Commands, MachineCommands } from './socketsHelper';
import e from 'express';

const logger = createTaggedLogger(path.basename(__filename));

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
      return new Turtle(id, faker.person.firstName(), payload.worldId, payload.fuel ? payload.fuel : 0, payload.inventory ? payload.inventory : []);
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
    } else {
      // update machine
      if (machine.type === 'turtle') {
        machine.fuel = (machineData as Turtle).fuel;
        machine.inventory = (machineData as Turtle).inventory
      }

      await updateMachine(machine);
      logger.info(`Machine updated in db with id: ${id}`);
    }

    ws.id = machine.id;
    ws.type = machine.type;
    this.machines[machine.id] = ws;
    ws.send(JSON.stringify({ type: 'register', id: machine.id, name: machine.name, success: true }));
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

  async data(ws: MachineWebSocket, message: Message, clientHandler: ClientWebSocketHandler) {
    const payload = message.payload
    if (!payload) {
      logger.info("Invalid payload, nothing to process.")
      return wsCommands.pass;
    }

    if (!message.id) {
      logger.info("No id provided, cannot process message.")
      return wsCommands.pass;
    }

    logger.info(`Processing data from machine ${message.id}: ${payload.type}`);
    switch (payload.command) {
      case MachineCommands.command_result:
        return await this.processCommandResult(message.id, payload);

      default:
        logger.info(`Unknown message type`);
        return wsCommands.pass;
    }
  }

  async processCommandResult(id: string, payload: any) : Promise<string | null> {
    if (!payload.success) {
      return wsCommands.pass;
    }

    if (!payload.type || payload.type !== 'turtle') {
      logger.info(`No type provided for machine result, or type is not supported`);
      return wsCommands.pass;
    }

    // get machine from db
    const machine = await getMachine(id);
    if (!machine) {
      logger.info(`Machine ${id} not found in db`);
      return wsCommands.pass;
    }

    const turtle : Turtle = (machine as Turtle);
    if (payload.fuel) {
      turtle.fuel = payload.fuel;
    }
    if (payload.inventory) {
      turtle.inventory = payload.inventory;
    }

    switch (payload.origin_command) {
      case ClientCommands.forward:
        moveForward(turtle);
        break;
      case ClientCommands.backward:
        moveBackward(turtle);
        break;
      case ClientCommands.left:
        turnLeft(turtle);
        break;
      case ClientCommands.right:
        turnRight(turtle);
        break;
      case ClientCommands.up:
        moveUp(turtle);
        break;
      case ClientCommands.down:
        moveDown(turtle);
        break;
      default:
        logger.info(`Unknown command: ${payload.origin_command}`);
        return wsCommands.pass;
    }

    await updateMachine(turtle);
    logger.info(`Machine ${id} updated with result`);
    return wsCommands.sync_machines_with_clients;
  }

  async acceptMachine(id: string, data: {cords? : {x : number, y : number, z : number}, facing?: Direction}, client: ClientWebSocket) : Promise<string | null> {
    if (!this.uninitiatedMachines[id]) {
      logger.info(`Machine ${id} does not exist in uninitiated machines`);
      return wsCommands.pass;
    }

    if (!MACHINE_API_KEY) {
      logger.error('Machine API key not set');
      return wsCommands.pass;
    }

    const ws = this.uninitiatedMachines[id];
    if (ws.type === 'turtle') {
      // if machine is already in the db, update it
      if (!data.cords || !data.facing) {
        logger.info(`Invalid data provided for turtle`);
        client.send(JSON.stringify({ type: 'command_error', payload: {command: ClientCommands.initiate_accept_machine, message: "invalid_input_data"} }));
        return wsCommands.pass;
      }

      const turtle = new Turtle(id, faker.person.firstName(), 'test_world', 0, []);
      turtle.x = data.cords.x;
      turtle.y = data.cords.y;
      turtle.z = data.cords.z;
      turtle.facing = data.facing;

      const machine = await getMachine(id);
      if (machine) {
        machine.x = turtle.x;
        machine.y = turtle.y;
        machine.z = turtle.z;
        machine.facing = turtle.facing;

        await updateMachine(machine);
        logger.info(`Machine ${id} updated`);
      } else {
        await addMachine(turtle);
        logger.info(`Machine ${id} accepted`);
      }

      ws.send(MACHINE_API_KEY);
      delete this.uninitiatedMachines[id];
      return wsCommands.sync_uninitiated_machines_with_clients
    }

    ws.send("REJECTED");
    delete this.uninitiatedMachines[id];
    logger.info(`Cannot accept machine ${id}, invalid type`);
    client.send(JSON.stringify({ type: 'command_error', payload: {command: ClientCommands.initiate_accept_machine, message: "invalid_machine_type"} }));
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

  sendCommand(machine_id: any, command: string): string | null {
    if (!this.machines[machine_id]) {
      logger.info(`Machine ${machine_id} does not exist`);
      return wsCommands.pass;
    }

    const ws = this.machines[machine_id];
    ws.send(JSON.stringify({ type: 'command', command: command }));
    return wsCommands.sync_machines_with_clients;
  }
};
