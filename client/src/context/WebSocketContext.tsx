import React, { createContext, useContext, useEffect, useRef } from 'react';

import useAuth from '../hooks/useAuth';
import { useUser } from './AuthContext';
import { useData } from './DataContext';

interface WebSocketContextProps {
  ws: WebSocket | null;
  sendMessage: (message: string) => void;
}

export const createClientPayload = (payload: any, apiKey: string | null | undefined) => {
  return {
    type: 'data',
    clientType: 'client',
    payload: payload,
    api_key: apiKey
  }
}

export enum CommandsSent {
  initiate_accept_machine = 'initiate_accept_machine',
  initiate_reject_machine = 'initiate_reject_machine',
};

enum CommandsReceived {
  sync_machines = 'sync_machines',
  sync_uninitiated = 'sync_uninitiated',
  sync_worlds = 'sync_worlds',
  register = 'register',
}


export const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const { setMachines, setUninitiatedMachines, setWorlds } = useData();

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.api_key) {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || `ws://${window.location.host}/ws`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connection opened');
        ws.current?.send(JSON.stringify({
          type: 'register',
          clientType: 'client',
          id: user.username,
          api_key: user.api_key,
        }));
      };

      ws.current.onmessage = (event) => {
        if (!event.data) {
          return;
        }

        const message = JSON.parse(event.data);
        console.log('Received message from socket server:', message);
        const command = message.type;
        switch (command) {
          case CommandsReceived.sync_machines:
            if (message.machines) {
              console.log('Syncing machines with server:', message.machines);
              setMachines(message.machines);
            }
            break;
          case CommandsReceived.sync_uninitiated:
            if (message.machines) {
              console.log('Syncing uninitiated machines with server:', message.machines);
              setUninitiatedMachines(message.machines);
            }
            break;
          case CommandsReceived.sync_worlds:
            if (message.worlds) {
              console.log('Syncing worlds with server:', message.worlds);
              setWorlds(message.worlds);
            }
            break;
          case CommandsReceived.register:
            console.log('Received registration confirmation from server:', message);
            break;
          default:
            console.error('Unknown command received from server:', command);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [isAuthenticated, user?.api_key]);

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.error('WebSocket is not open. Cannot send message.');
    }
  };

  return (
    <WebSocketContext.Provider value={{ ws: ws.current, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
