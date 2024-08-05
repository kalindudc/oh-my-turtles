import http from 'http';
import path from 'path';
import WebSocket from 'ws';
import { Mutex } from 'async-mutex';

import { config } from '../config';
import createTaggedLogger from '../logger/logger';
import { ClientWebSocketHandler, isClientAuthorized } from './clientWsHandler';
import { MachineWebSocketHandler } from './machineWsHandler';
import { Commands } from '../util/socketsHelper';
import { randomUUID } from 'crypto';
import { addTask } from '../util/taskQueue';
import winston from 'winston';

const logger = createTaggedLogger(path.basename(__filename));

const messageQueue = "messageQueue";
const commandQueue = "commandQueue";

const socketMap : Map<string, WebSocket> = new Map();

export interface WebSocketHandler {
  register(ws: ClientWebSocket, message: Message) : Promise<string>;
  unregister(ws: ClientWebSocket) : Promise<string>;
  data(ws: ClientWebSocket, message: Message, handler: ClientWebSocketHandler | MachineWebSocketHandler) : Promise<string>;
}

enum ClientType {
  CLIENT = 'client',
  MACHINE = 'machine',
}

// Types for WebSocket metadata and messages
export interface ClientWebSocket extends WebSocket {
  id?: string;
  username?: string
}

export interface MachineWebSocket extends WebSocket {
  id?: string;
  type?: string;
  machineId?: string;
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

export const getSocketMap = () => {
  return socketMap;
}

export const getClientHandler = () => { return clientHandler; };
export const getMachineHandler = () => { return machineHandler; };

// WebSocket connection handler
export const handleWebSocket = (ws: ClientWebSocket, req: http.IncomingMessage) => {
  logger.info('New client initiating connection...');
  ws.id = randomUUID();
  socketMap.set(ws.id, ws);

  ws.on('message', (message: string) => {
    logger.info(`Received message: ${message}`);
    let parsedMessage: Message;
    try {
      parsedMessage = JSON.parse(message);
    }
    catch (error) {
      logger.error('Error parsing message:', error);
      return;
    }
    addTask(messageQueue, () => processMessage(parsedMessage, ws.id, logger, () => {}));
  });

  ws.on('close', () => {
    logger.info('Client or Machine disconnecting...');

    addTask(messageQueue, async () => await processMessage({type: 'close'}, ws.id, logger, () => {}));
  });
};

const processCommand = async (command: string, ws: ClientWebSocket, message: Message, clientHandler: ClientWebSocketHandler, machineHandler: MachineWebSocketHandler, done: Function) => {
  if (!command) {
    return;
  }

  switch (command) {
    case Commands.sync_machines_with_clients:
      clientHandler.syncMachinesWithClients(machineHandler.machines);
      break;

    case Commands.sync_uninitiated_machines_with_clients:
      clientHandler.syncUninitiatedMachinesWithClients(machineHandler.uninitiatedMachines);
      clientHandler.syncWorldsWithClients();
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

  logger.info(`Command processed: ${command}, done`);
  done();
};


const processMessage = async (parsedMessage:any, wsId:string | undefined, logger: winston.Logger, done : Function) => {
  if (!wsId) {
    logger.error('No websocket id provided');
    return;
  }

  const ws = socketMap.get(wsId);
  if (!ws) {
    logger.error('No websocket found for id:', wsId);
    return;
  }

  let commandToProcess : string = Commands.pass;
  if (parsedMessage.type === 'initiate') {
    logger.info('Initiating machine...');
    commandToProcess = await machineHandler.registerUninitiated(ws, parsedMessage);
    addTask(commandQueue, async () => await processCommand(commandToProcess, ws, parsedMessage, clientHandler, machineHandler, () => {}));
    return;
  }

  if (parsedMessage.type === 'close') {
    logger.info('Closing connection...');
    await clientHandler.unregister(ws);
    await machineHandler.unregister(ws);
    await machineHandler.unregisterUninitiated(ws);

    addTask(commandQueue, async () => await processCommand(Commands.sync_machines_with_clients, ws, parsedMessage, clientHandler, machineHandler, () => {
      socketMap.delete(wsId);
    }));
    return;
  }

  if (!parsedMessage.clientType && !(parsedMessage.clientType in ClientType)) {
    logger.warn('No client type provided');
    ws.close(1008, 'Invalid client type');
    return;
  }

  const apiKey = parsedMessage.api_key;
  const clientType = parsedMessage.clientType as ClientType;
  if (!isAuthorized(apiKey, clientType)) {
    logger.warn('Not authorized, connection closed');
    ws.close(1008, 'Not authorized');
    return;
  }

  const handlers : {[key : string] : ClientWebSocketHandler | MachineWebSocketHandler} = {
    [ClientType.CLIENT]: clientHandler,
    [ClientType.MACHINE]: machineHandler,
  }

  switch (parsedMessage.type) {
    case 'register':
      commandToProcess = await handlers[clientType].register(ws, parsedMessage);
      break;

    case 'unregister':
      commandToProcess = await handlers[clientType].unregister(ws);
      break;

    case 'data':
      if (clientType === ClientType.MACHINE) {
        commandToProcess = await machineHandler.data(ws, parsedMessage, clientHandler);
      }
      else {
        commandToProcess = await clientHandler.data(ws, parsedMessage, machineHandler);
      }
      break;

    default:
      logger.warn('Unknown message type');
  }

  addTask(commandQueue, async () => await processCommand(commandToProcess, ws, parsedMessage, clientHandler, machineHandler, () => {}));
  done();
}

