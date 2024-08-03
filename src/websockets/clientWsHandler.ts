import WebSocket from 'ws';
import path from 'path';

import { ClientWebSocket, Message, WebSocketHandler } from './wsHandler';
import createTaggedLogger from '../logger';
import exp from 'constants';

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

export const isClientAuthorized = (apiKey: string | undefined) => {
  if (!apiKey) {
    return false;
  }

  return API_KEYS.map((k) => k.apiKey).includes(apiKey)
}

export class ClientWebSocketHandler implements WebSocketHandler {

  clients: ClientWebSocket[];
  constructor() {
    this.clients = [];
  }

  register(ws: ClientWebSocket, message: Message) {
    this.clients.push(ws);
    logger.info(`Client registered with id: ${message.id}`);
    ws.send(JSON.stringify({ type: 'register', id: message.id }));
  }

  unregister(ws: ClientWebSocket) {
    if (this.clients.indexOf(ws) === -1) {
      return;
    }

    logger.info(`Unregistering...`);
    this.clients.splice(this.clients.indexOf(ws), 1);
    logger.info(`Client unregistered`);
  }

  data(ws: ClientWebSocket, message: Message) {
    logger.info(`Received data from ${ws.type} with id ${ws.id}: ${message.payload}`);
  }
};
