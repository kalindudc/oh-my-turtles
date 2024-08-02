import WebSocket from 'ws';
import { CLIENT_API_KEY, ClientWebSocketHandler } from './_clientWsHandler';
import { MACHINE_API_KEY, MachineWebSocketHandler } from './_machineWsHandler';
import http from 'http';

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
}

const isAuthorized = (apiKey: string | null, type: ClientType) => {
  if (!apiKey) {
    return false;
  }

  if (type === ClientType.CLIENT && apiKey === CLIENT_API_KEY) {
    return true;
  }

  if (type === ClientType.MACHINE && apiKey === MACHINE_API_KEY) {
    return true;
  }

  return false;
}

const handlers : {[key in ClientType]?: WebSocketHandler} = {
  [ClientType.CLIENT]: new ClientWebSocketHandler(),
  [ClientType.MACHINE]: new MachineWebSocketHandler(),
};

// WebSocket connection handler
export const handleWebSocket = (ws: ClientWebSocket, req: http.IncomingMessage) => {
  console.log('New client initiating connection...');

  const queryParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
  const apiKey = queryParams.get('apiKey');

  ws.on('message', (message: string) => {
    (async () => {

      try {
        console.log(`Received message: ${message}`);
        const parsedMessage: Message = JSON.parse(message);

        if (!parsedMessage.clientType && !ClientType[parsedMessage.clientType]) {
          console.log('No client type provided');
          ws.close(1008, 'Invalid client type');
          return;
        }

        const clientType = parsedMessage.clientType as ClientType;

        if (!isAuthorized(apiKey, clientType)) {
          console.log('No API key provided');
          ws.close(1008, 'Not authorized');
          return
        }

        if (!handlers[clientType]) {
          console.log('No handler found for client type');
          ws.close(1008, 'Invalid client type');
          return;
        }

        switch (parsedMessage.type) {
          case 'register':
            await handlers[clientType].register(ws, parsedMessage);
            break;

          case 'unregister':
            handlers[clientType].unregister(ws);
            break;

          case 'data':
            handlers[clientType].data(ws, parsedMessage);
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
    console.log('Client disconnected');
    handlers[ClientType.CLIENT]?.unregister(ws);
    handlers[ClientType.MACHINE]?.unregister(ws);
  });
};
