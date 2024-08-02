import WebSocket from 'ws';
import { ClientWebSocket, Message, WebSocketHandler } from './wsHandler';

export const CLIENT_API_KEY = process.env.CLIENT_API_KEY;

export class ClientWebSocketHandler implements WebSocketHandler {

  clients: ClientWebSocket[];
  constructor() {
    this.clients = [];
  }

  register(ws: ClientWebSocket, message: Message) {
    this.clients.push(ws);
    console.log(`Client registered with id: ${message.id}`);
    ws.send(JSON.stringify({ type: 'register', id: message.id }));
  }

  unregister(ws: ClientWebSocket) {
    if (this.clients.indexOf(ws) === -1) {
      return;
    }

    console.log(`Unregistering...`);
    this.clients.splice(this.clients.indexOf(ws), 1);
    console.log(`Client unregistered`);
  }

  data(ws: ClientWebSocket, message: Message) {
    console.log(`Received data from ${ws.type} with id ${ws.id}: ${message.payload}`);
  }
};
