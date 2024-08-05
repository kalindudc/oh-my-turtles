import winston from "winston";
import { ClientWebSocket, MachineWebSocket } from "../websockets/wsHandler";

export enum Commands {
  sync_machines_with_clients = 'sync_machines_with_clients',
  sync_machines_with_current_client = 'sync_machines_with_current_client',
  sync_uninitiated_machines_with_clients = 'sync_uninitiated_machines_with_clients',
  sync_worlds_with_clients = 'sync_worlds_with_clients',
  pass = 'pass',
}

export enum ClientCommands {
  initiate_accept_machine = 'initiate_accept_machine',
  initiate_reject_machine = 'initiate_reject_machine',
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  up = 'up',
  down = 'down',
  inspect = 'inspect',
  inspect_up = 'inspect_up',
  inspect_down = 'inspect_down',
}

export enum MachineCommands {
  command_result = 'command_result',
  move_inspect = 'move_inspect',
}

export const sendMessage = (ws: WebSocket | ClientWebSocket | MachineWebSocket, message: string, logger : winston.Logger )  =>  {
  if (ws.readyState === ws.OPEN) {
    (ws as WebSocket).send(message);
  } else {
    logger.warn(`Websocket not open, cannon send message: ${message}`);
  }
}
