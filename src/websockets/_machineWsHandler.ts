import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

import { ClientWebSocket, Message, WebSocketHandler } from './wsHandler';
import { addWorld, getWorld, World } from '../models/world';
import { getMachine, addMachine, Machine, Turtle } from '../models/machine';

export const MACHINE_API_KEY = process.env.MACHINE_API_KEY

export class MachineWebSocketHandler implements WebSocketHandler {

  machines: ClientWebSocket[];
  constructor() {
    this.machines = [];
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
      console.log(`Machine added with id: ${id}`);
    }

    this.machines.push(ws);
    ws.send(JSON.stringify({ type: 'register', id: machine.id, name: machine.name }));
    console.log(`Machine registered with id: ${id}, machine count: ${this.machines.length}`);
  }

  unregister(ws: ClientWebSocket) {
    if (this.machines.indexOf(ws) === -1) {
      return;
    }

    console.log(`Unregistering...`);
    this.machines.splice(this.machines.indexOf(ws), 1);
    console.log(`Machine unregistered`);
  }

  data(ws: ClientWebSocket, message: Message) {
    console.log(`Received data from ${ws.type} with id ${ws.id}: ${message.payload}`);
  }
};
