import http from 'http';
import path from 'path';
import WebSocket from 'ws';

import { config } from '../config';
import createTaggedLogger from '../logger/logger';
import { ClientWebSocketHandler, isClientAuthorized } from './clientWsHandler';
import { MachineWebSocketHandler } from './machineWsHandler';
import { Commands } from './socketsHelper';

const logger = createTaggedLogger(path.basename(__filename));

export interface WebSocketHandler {
  register(ws: ClientWebSocket, message: Message): string | null | Promise<string | null>;
  unregister(ws: ClientWebSocket): string | null;
  data(ws: ClientWebSocket, message: Message, handler: WebSocketHandler): string | null | Promise<string | null>;
}

enum ClientType {
  CLIENT = 'client',
  MACHINE = 'machine',
}

// Types for WebSocket metadata and messages
export interface ClientWebSocket extends WebSocket {
  id?: string;
}

export interface MachineWebSocket extends WebSocket {
  type?: string;
  id?: string;
}

export interface Message {
  type: 'register' | 'unregister' | 'data' | 'initiate';
  clientType: ClientType;
  id?: string;
  payload?: any;
  api_key?: string;
}

const isAuthorized = (apiKey: string | undefined, type: ClientType) => {
  if (!apiKey) {
    logger.info('No API key provided');
    return false;
  }

  if (type === ClientType.CLIENT && isClientAuthorized(apiKey)) {
    logger.info('Client authorized with API key');
    return true;
  }

  if (type === ClientType.MACHINE && apiKey === config.machine.apiKey) {
    logger.info('Machine authorized with API key');
    return true;
  }

  return false;
}

const machineHandler : MachineWebSocketHandler = new MachineWebSocketHandler();
const clientHandler : ClientWebSocketHandler = new ClientWebSocketHandler();

export const getUninitiatedMachines = () => {
  return machineHandler.uninitiatedMachines;
};

export const getActiveMachines = () => {
  return machineHandler.machines;
};

export const getActiveClients = () => {
  return clientHandler.clients;
}

export const getClientHandler = () => { return clientHandler; };
export const getMachineHandler = () => { return machineHandler; };

// WebSocket connection handler
export const handleWebSocket = (ws: ClientWebSocket, req: http.IncomingMessage) => {
  logger.info('New client initiating connection...');

  ws.on('message', (message: string) => {
    const parsedMessage: Message = JSON.parse(message);
    let commandToProcess : string | null = null;

    if (parsedMessage.type === 'initiate') {
      commandToProcess = machineHandler.registerUninitiated(ws, parsedMessage);
      processCommand(commandToProcess, ws, parsedMessage, clientHandler, machineHandler);
      return;
    }

    (async () => {

      try {
        logger.info(`Received message: ${message}`);
        const apiKey = parsedMessage.api_key;

        if (!parsedMessage.clientType && !ClientType[parsedMessage.clientType]) {
          logger.info('No client type provided');
          ws.close(1008, 'Invalid client type');
          return;
        }

        const clientType = parsedMessage.clientType as ClientType;

        if (!isAuthorized(apiKey, clientType)) {
          logger.info('Not authorized, connection closed');
          ws.close(1008, 'Not authorized');
          return
        }

        switch (parsedMessage.type) {
          case 'register':

            if (clientType === ClientType.CLIENT) {
              commandToProcess = clientHandler.register(ws, parsedMessage);
            } else {
              commandToProcess = await machineHandler.register(ws, parsedMessage);
            }
            break;

          case 'unregister':
            if (clientType === ClientType.CLIENT) {
              commandToProcess = clientHandler.unregister(ws);
            } else {
              commandToProcess = machineHandler.unregister(ws);
            }
            break;

          case 'data':
            if (clientType === ClientType.CLIENT) {
              commandToProcess = await clientHandler.data(ws, parsedMessage, machineHandler);
            } else {
              commandToProcess = await machineHandler.data(ws, parsedMessage, clientHandler);
            }
            break;

          default:
            logger.info('Unknown message type');
        }
      } catch (error) {
        logger.info('Error parsing message:', error);
      }

    })().then(() => {
      processCommand(commandToProcess, ws, parsedMessage, clientHandler, machineHandler);
    });
  });

  ws.on('close', () => {
    logger.info('Client or Machine disconnected');
    clientHandler.unregister(ws);
    machineHandler.unregister(ws);
    machineHandler.unregisterUninitiated(ws);
  });
};

const processCommand = (command: string | null, ws: ClientWebSocket, message: Message, clientHandler: ClientWebSocketHandler, machineHandler: MachineWebSocketHandler) => {
  if (!command) {
    return;
  }

  switch (command) {
    case Commands.sync_machines_with_clients:
      clientHandler.syncMachinesWithClients(machineHandler.machines);
      break;

    case Commands.sync_uninitiated_machines_with_clients:
      clientHandler.syncUninitiatedMachinesWithClients(machineHandler.uninitiatedMachines);
      break;

    case Commands.sync_machines_with_current_client:
      clientHandler.syncMachinesWithClient(ws, machineHandler.machines);
      break;

    case Commands.sync_worlds_with_clients:
      clientHandler.syncWorldsWithClients();
      break;

    case Commands.pass:
      break;

    default:
      logger.info(`Unknown command: ${command}`);
  }
};
