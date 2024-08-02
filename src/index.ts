// src/server.ts
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { initializeWorldDB, addWorld, getWorld, World } from './models/world';
import { initializeMachineDB, getMachine, addMachine, Machine, Turtle } from './models/machine';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Types for WebSocket metadata and messages
interface ClientWebSocket extends WebSocket {
  type?: 'client' | 'machine';
  id?: string;
}

interface Message {
  type: 'register' | 'unregister' | 'data';
  clientType: 'client' | 'machine';
  id?: string;
  payload?: any;
}

const clients: ClientWebSocket[] = [];
const machines: ClientWebSocket[] = [];

async function initializeDB() {
  await initializeWorldDB();
  await initializeMachineDB();
}

function parsePayload(id: string, world: World, payload: any): Machine | null {

  if (payload.type === 'turtle') {
    return new Turtle(id, faker.person.firstName(), 0, 0, 0, world, payload.fuel, payload.inventory);
  }

  return null;
}

async function registerMachine(ws: ClientWebSocket, id: string | undefined, payload: any) {
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
  const machineData = parsePayload(newId, world, payload);
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

  machines.push(ws);
  ws.send(JSON.stringify({ type: 'register', id: machine.id, name: machine.name }));
  console.log(`Machine registered with id: ${id}`);
}

async function register(ws: ClientWebSocket, clientType: 'client' | 'machine', id: string | undefined, payload: any) {
  ws.type = clientType;
  ws.id = id;

  if (clientType === 'client') {
    clients.push(ws);
    console.log(`User registered with id: ${id}`);
    ws.send(JSON.stringify({ type: 'register', id: id }));
  } else if (clientType === 'machine') {
    await registerMachine(ws, id, payload);
  }

  console.log(`Clients: ${clients}, Machines: ${machines}`);
}

async function unregister(ws: ClientWebSocket) {
  console.log(`Unregistering ${ws.type} with id: ${ws.id}`);
  if (ws.type === 'client') {
    clients.splice(clients.indexOf(ws), 1);
    console.log(`User unregistered with id: ${ws.id}`);
  } else if (ws.type === 'machine') {
    machines.splice(machines.indexOf(ws), 1);
    console.log(`Machine unregistered with id: ${ws.id}`);
  }
}


initializeDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: ClientWebSocket) => {
    console.log('New client connected');

    ws.on('message', (message: string) => {
      (async () => {
        try {
          console.log(`Received message: ${message}`);
          const parsedMessage: Message = JSON.parse(message);

          switch (parsedMessage.type) {
            case 'register':
              await register(ws, parsedMessage.clientType, parsedMessage.id, parsedMessage.payload);
              break;

            case 'unregister':
              await unregister(ws);
              break;

            case 'data':
              // Handle data messages
              console.log(`Received data from ${ws.type} with id ${ws.id}: ${parsedMessage.payload}`);
              break;

            default:
              console.log('Unknown message type');
          }
        } catch (error) {
          console.log('Error parsing message:', error);
        }
      })();
    });

    ws.on('close', () => {
      (async () => {await unregister(ws)})();
    });
  });
});
