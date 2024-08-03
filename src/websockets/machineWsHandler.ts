import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';
import path from 'path';

import { ClientWebSocket, Message, WebSocketHandler } from './wsHandler';
import { addWorld, getWorld, World } from '../models/world';
import { getMachine, addMachine, Machine, Turtle } from '../models/machine';
import createTaggedLogger from '../logger';

const logger = createTaggedLogger(path.basename(__filename));

export const MACHINE_API_KEY = process.env.MACHINE_API_KEY

export class MachineWebSocketHandler implements WebSocketHandler {

  machines: ClientWebSocket[];
  uninitiatedMachines: WebSocket[];
  constructor() {
    this.machines = [];
    this.uninitiatedMachines = [];
  }

  registerUninitiated(ws: WebSocket) {
    this.uninitiatedMachines.push(ws);
    logger.info(`Uninitiated machine registered`);
  }

  unregisterUninitiated(ws: WebSocket) {
    if (this.uninitiatedMachines.indexOf(ws) === -1) {
      return;
    }

    this.uninitiatedMachines.splice(this.uninitiatedMachines.indexOf(ws), 1);
    logger.info(`Uninitiated machine unregistered`);
  }

  initiateMachine(ws: WebSocket) {
    if (this.uninitiatedMachines.indexOf(ws) === -1) {
      logger.info(`Machine not registered`);
      return;
    }

    if (!MACHINE_API_KEY) {
      throw new Error('Machine API key not set');
    }

    this.uninitiatedMachines.splice(this.uninitiatedMachines.indexOf(ws), 1);
    ws.send(MACHINE_API_KEY);
    logger.info(`Machine initiated`);
  }

  parsePayload(id: string, world: World, payload: any): Machine | null {
    if (payload.type === 'turtle') {
      return new Turtle(id, faker.person.firstName(), 0, 0, 0, world, payload.fuel, payload.inventory);
    }
    return null;
  }

  async register(ws: ClientWebSocket, message: Message) {
    const id = message.id;
    const payload = message.payload;


    if (!payload.type || !payload.worldId) {
      // Invalid payload
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
      return;
    }

    var world = await getWorld(payload.worldId);
    if (!world) {
      // world does not exist, register it
      world = await addWorld({ id: payload.worldId, name: payload.worldId, blocks: [] });
    }

    const newId : string = id? id : randomUUID();
    const machineData = this.parsePayload(newId, world, payload);
    if (!machineData) {
      // Invalid payload
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid machine type' }));
      return;
    }

    var machine = await getMachine(newId);
    if (!machine) {
      await addMachine(machineData).then((machine) => {
        ws.id = machine.id;
      });
      machine = machineData;
      logger.info(`Machine added with id: ${id}`);
    }

    this.machines.push(ws);
    ws.send(JSON.stringify({ type: 'register', id: machine.id, name: machine.name }));
    logger.info(`Machine registered with id: ${id}, machine count: ${this.machines.length}`);
  }

  unregister(ws: ClientWebSocket) {
    if (this.machines.indexOf(ws) === -1) {
      return;
    }

    logger.info(`Unregistering...`);
    this.machines.splice(this.machines.indexOf(ws), 1);
    logger.info(`Machine unregistered`);
  }

  data(ws: ClientWebSocket, message: Message) {
    logger.info(`Received data from ${ws.type} with id ${ws.id}: ${message.payload}`);
  }
};
