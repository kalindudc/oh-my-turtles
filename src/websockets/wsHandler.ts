import WebSocket from 'ws';
import path from 'path';
import http from 'http';

import { isClientAuthorized, ClientWebSocketHandler } from './clientWsHandler';
import { MACHINE_API_KEY, MachineWebSocketHandler } from './machineWsHandler';
import createTaggedLogger from '../logger';

const logger = createTaggedLogger(path.basename(__filename));

export interface WebSocketHandler {
  register(ws: ClientWebSocket, message: Message): void;
  unregister(ws: ClientWebSocket): void;
  data(ws: ClientWebSocket, message: Message): void;
}

enum ClientType {
  CLIENT = 'client',
  MACHINE = 'machine',
}

// Types for WebSocket metadata and messages
export interface ClientWebSocket extends WebSocket {
  type?: ClientType;
  id?: string;
}

export interface Message {
  type: 'register' | 'unregister' | 'data';
  clientType: ClientType;
  id?: string;
  payload?: any;
  api_key?: string;
}

const isAuthorized = (apiKey: string | undefined, type: ClientType) => {
  if (!apiKey) {
    return false;
  }

  if (type === ClientType.CLIENT && isClientAuthorized(apiKey)) {
    return true;
  }

  if (type === ClientType.MACHINE && apiKey === MACHINE_API_KEY) {
    return true;
  }

  return false;
}

const clientHandler : ClientWebSocketHandler = new ClientWebSocketHandler();
const machineHandler : MachineWebSocketHandler = new MachineWebSocketHandler();


// WebSocket connection handler
export const handleWebSocket = (ws: ClientWebSocket, req: http.IncomingMessage) => {
  logger.info('New client initiating connection...');

  ws.on('message', (message: string) => {
    if (`${message}` === 'initiate') {
      machineHandler.registerUninitiated(ws);
      return;
    }

    (async () => {

      try {
        logger.info(`Received message: ${message}`);
        const parsedMessage: Message = JSON.parse(message);
        const apiKey = parsedMessage.api_key;

        if (!parsedMessage.clientType && !ClientType[parsedMessage.clientType]) {
          logger.info('No client type provided');
          ws.close(1008, 'Invalid client type');
          return;
        }

        const clientType = parsedMessage.clientType as ClientType;

        if (!isAuthorized(apiKey, clientType)) {
          logger.info('No API key provided');
          ws.close(1008, 'Not authorized');
          return
        }

        switch (parsedMessage.type) {
          case 'register':

            if (clientType === ClientType.CLIENT) {
              clientHandler.register(ws, parsedMessage);
            } else {
              await machineHandler.register(ws, parsedMessage);
            }
            break;

          case 'unregister':
            if (clientType === ClientType.CLIENT) {
              clientHandler.unregister(ws);
            } else {
              machineHandler.unregister(ws);
            }
            break;

          case 'data':
            if (clientType === ClientType.CLIENT) {
              clientHandler.data(ws, parsedMessage);
            } else {
              machineHandler.data(ws, parsedMessage);
            }
            break;

          default:
            logger.info('Unknown message type');
        }
      } catch (error) {
        logger.info('Error parsing message:', error);
      }

    })();
  });

  ws.on('close', () => {
    logger.info('Client disconnected');
    clientHandler.unregister(ws);
    machineHandler.unregister(ws);
    machineHandler.unregisterUninitiated(ws);
  });
};
