import { faker } from '@faker-js/faker';
import { vec3 } from 'gl-matrix';
import path from 'path';

import { config } from '../config';
import createTaggedLogger from '../logger/logger';
import { addMachine, Direction, generateMachineID, getMachine, getNewPosition, moveBackward, moveDown, moveForward, moveUp, turnLeft, turnRight, Turtle, updateMachine } from '../models/machine';
import { addOrUpdateBlock, addWorld, Block, BlockType, getWorld } from '../models/world';
import { ClientWebSocketHandler } from './clientWsHandler';
import { ClientCommands, MachineCommands, Commands as wsCommands } from './socketsHelper';
import { ClientWebSocket, MachineWebSocket, Message, WebSocketHandler } from './wsHandler';


const logger = createTaggedLogger(path.basename(__filename));

const MACHINE_API_KEY = config.machine.apiKey;

export class MachineWebSocketHandler implements WebSocketHandler {
  machines: {[key: string]: MachineWebSocket};
  uninitiatedMachines:{[key: string]: MachineWebSocket};
  constructor() {
    this.machines = {};
    this.uninitiatedMachines = {};
  }

  registerUninitiated(ws: MachineWebSocket, payload: Message) : string | null {
    if (!payload.id) {
      logger.error(`Uninitiated machine id not provided`);
      return wsCommands.pass;
    }

    ws.id = payload.id;
    if (payload.payload) {
      ws.type = payload.payload.type;
    }
    this.uninitiatedMachines[payload.id] = ws;
    logger.info(`Uninitiated machine registered`);
    return wsCommands.sync_uninitiated_machines_with_clients;
  }

  unregisterUninitiated(ws: MachineWebSocket) : string | null {
    const id : string | undefined = Object.keys(this.uninitiatedMachines).find(key => this.uninitiatedMachines[key] === ws)
    if (!id) {
      return wsCommands.pass;
    }

    delete this.uninitiatedMachines[id];
    logger.info(`Uninitiated machine unregistered`);
    return wsCommands.sync_uninitiated_machines_with_clients;
  }

  async registerTurtle(ws: MachineWebSocket, computer_id: string, machine: Turtle | null, payload: any) : Promise<null> {
    const turtle = new Turtle(computer_id, faker.person.firstName(), payload.world_id, payload.fuel ? payload.fuel : 0, payload.inventory ? payload.inventory : []);
    if (!machine) {
      await addMachine(turtle);
      logger.info(`New machine added to db with id: ${computer_id}`);
    } else {
      machine.fuel = turtle.fuel;
      machine.inventory = turtle.inventory;
      await updateMachine(machine);
      logger.info(`Machine updated in db with id: ${computer_id}`);
    }

    ws.id = turtle.id;
    ws.type = turtle.type;
    return null;
  }

  async register(ws: MachineWebSocket, message: Message) {
    const computer_id = message.id;
    const payload = message.payload;

    if (!payload.type || !payload.world_id || !computer_id) {
      // Invalid payload
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
      return wsCommands.pass;
    }

    var world = await getWorld(payload.world_id);
    if (!world) {
      // world does not exist, register it
      logger.error(`New world added to db with id: ${payload.world_id}`);
      world = await addWorld({ id: payload.world_id, name: payload.world_id, blocks: [] });
    }

    const id : string = generateMachineID(computer_id, payload.world_id);
    let machine = await getMachine(id);
    let err = null
    if (payload.type === 'turtle') {
      err = await this.registerTurtle(ws, computer_id, machine, payload);
    } else {
      err = "invalid_machine_type";
    }

    if (err) {
      logger.error(`Cannot register machine ${computer_id}, ${err}`);
      ws.send(JSON.stringify({type: 'register', success: false, error: err}));
      return wsCommands.pass
    }

    this.machines[machine.id] = ws;
    ws.send(JSON.stringify({ type: 'register', id: machine.id, name: machine.name, success: true }));
    logger.info(`Machine registered with id: ${id}, machine count: ${Object.keys(this.machines).length}`);
    return wsCommands.sync_machines_with_clients;
  }

  unregister(ws: MachineWebSocket) {
    const id : string | undefined = Object.keys(this.machines).find(key => this.machines[key] === ws)
    if (!id) {
      return wsCommands.pass;
    }

    delete this.machines[id];
    logger.info(`Machine unregistered`);
    return wsCommands.sync_machines_with_clients;
  }

  async data(ws: MachineWebSocket, message: Message, clientHandler: ClientWebSocketHandler) {
    const payload = message.payload
    if (!payload) {
      logger.error("Invalid payload, nothing to process.")
      return wsCommands.pass;
    }

    if (!message.id) {
      logger.error("No id provided, cannot process message.")
      return wsCommands.pass;
    }

    logger.info(`Processing data from machine ${message.id}: ${payload.type}`);
    switch (payload.command) {
      case MachineCommands.command_result:
        return await this.processCommandResult(message.id, payload, clientHandler);

      default:
        logger.info(`Unknown message type`);
        return wsCommands.pass;
    }
  }

  async processCommandResult(computer_id: string, payload: any, clientHandler: ClientWebSocketHandler) : Promise<string | null> {
    if (!payload.success) {
      const origin_initiator = payload.origin_initiated_client
      if (origin_initiator && clientHandler.clients[origin_initiator]) {

        const ws = clientHandler.clients[origin_initiator];
        ws.send(JSON.stringify({ type: 'command_result', payload: {command: payload.origin_command, type: "error", error: payload.error} }));
      }
      return wsCommands.pass;
    }

    if (!payload.type || payload.type !== 'turtle') {
      logger.error(`No type provided for machine result, or type is not supported`);
      return wsCommands.pass;
    }

    if (!payload.world_id) {
      logger.error(`No world id provided for machine result`);
      return wsCommands.pass;
    }

    // get machine from db
    const id = generateMachineID(computer_id, payload.world_id);
    const machine = await getMachine(id);
    if (!machine) {
      logger.error(`Machine ${id} not found in db`);
      return wsCommands.pass;
    }

    const turtle : Turtle = (machine as Turtle);
    if (payload.fuel) {
      turtle.fuel = payload.fuel;
    }
    if (payload.inventory) {
      turtle.inventory = payload.inventory;
    }

    switch (payload.origin_command) {
      case ClientCommands.forward:
        moveForward(turtle);
        break;
      case ClientCommands.backward:
        moveBackward(turtle);
        break;
      case ClientCommands.left:
        turnLeft(turtle);
        break;
      case ClientCommands.right:
        turnRight(turtle);
        break;
      case ClientCommands.up:
        moveUp(turtle);
        break;
      case ClientCommands.down:
        moveDown(turtle);
        break;
      case ClientCommands.inspect:
      case ClientCommands.inspect_up:
      case ClientCommands.inspect_down:
        return await this.handleInspect(turtle, payload);
      case MachineCommands.move_inspect:
        return await this.handleMoveInspect(turtle, payload);
      default:
        logger.info(`Unknown command: ${payload.origin_command}`);
        return wsCommands.pass;
    }

    await updateMachine(turtle);
    logger.info(`Machine ${id} updated with result`);
    return wsCommands.sync_machines_with_clients;
  }

  async handleBlockUpdate(turtle: Turtle, direction: Direction, block_data: {name? : string, is_solid: boolean, is_peripheral? : boolean}) : Promise<string | null> {
    const worldId = turtle.world_id;
    if (!block_data.name || !block_data.is_solid) {
      logger.info(`The block is probably "AIR" or "VOID", ignoring...`);
      return null;
    }

    const blockName = block_data.name;
    const blockPos = getNewPosition(direction, vec3.fromValues(turtle.x, turtle.y, turtle.z));
    const block : Block = {
      id: blockName,
      x: blockPos[0],
      y: blockPos[1],
      z: blockPos[2],
      is_solid: block_data.is_solid,
      type: block_data.is_peripheral ? BlockType.PERIPHERAL : BlockType.STATIC
    }
    logger.info(`Block inspected: ${block.id} at ${block.x}, ${block.y}, ${block.z}`);

    // update block in world or add new block
    const world = await getWorld(worldId);
    if (!world) {
      logger.error(`World ${worldId} not found`);
      return `world_not_found_${worldId}`;
    }
    const err = await addOrUpdateBlock(world.id, block);
    if (err) {
      logger.error(`Error updating block in world ${worldId} with error ${err}`);
      return `error_updating_block_${err}`;
    }
    return null;
  }

  async handleMoveInspect(turtle: Turtle, payload: any) : Promise<wsCommands> {
    logger.info(`Inspect results after moving machine ${turtle.id}`);
    if (!payload.block_data) {
      logger.error(`No block provided for inspect command`);
      return wsCommands.pass;
    }

    const allErrors = [];
    let err = await this.handleBlockUpdate(turtle, turtle.facing, payload.block_data.forward);
    if (err) {
      logger.error(`Error handling block update: ${err} for direction ${turtle.facing}`);
      allErrors.push(err);
    }

    err = await this.handleBlockUpdate(turtle, Direction.up, payload.block_data.up);
    if (err) {
      logger.error(`Error handling block update: ${err} for direction up`);
      allErrors.push(err);
    }

    err = await this.handleBlockUpdate(turtle, Direction.down, payload.block_data.down);
    if (err) {
      logger.error(`Error handling block update: ${err} for direction down`);
      allErrors.push(err);
    }

    if (allErrors.length > 0) {
      return wsCommands.pass;
    }

    logger.info(`Blocks successfully updated in world ${turtle.world_id}`);
    return wsCommands.sync_worlds_with_clients;
  }

  async handleInspect(turtle: Turtle, payload: any) : Promise<wsCommands> {
    logger.info(`Inspecting block results from machine ${turtle.id}`);
    if (!payload.block) {
      logger.error(`No block provided for inspect command`);
      return wsCommands.pass;
    }

    let direction = turtle.facing;
    if (payload.origin_command === ClientCommands.inspect_up) {
      direction = Direction.up;
    } else if (payload.origin_command === ClientCommands.inspect_down) {
      direction = Direction.down;
    }

    logger.info(`Inspecting block in direction ${direction}`);
    const err = await this.handleBlockUpdate(turtle, direction, payload.block);
    if (err) {
      logger.error(`Error handling block update: ${err}`);
      return wsCommands.pass;
    }

    logger.info(`Block successfully updated in world ${turtle.world_id}`);
    return wsCommands.sync_worlds_with_clients;
  }

  async acceptTurtle(id: string, machine: Turtle, data: {cords? : {x : number, y : number, z : number}, facing?: Direction, world_id : string}) : Promise<string | null> {
    // if machine is already in the db, update it
    if (!data.cords || !data.facing || !data.world_id) {
      logger.error(`Invalid data provided for turtle`);
      return "invalid_input_data";
    }

    const turtle = new Turtle(id, faker.person.firstName(), data.world_id, 0, []);
    turtle.x = data.cords.x;
    turtle.y = data.cords.y;
    turtle.z = data.cords.z;
    turtle.facing = data.facing;

    if (machine) {
      // TODO: do not allow update, this can override existing tuetles
      machine.x = turtle.x;
      machine.y = turtle.y;
      machine.z = turtle.z;
      machine.facing = turtle.facing;
      machine.world_id = turtle.world_id;

      await updateMachine(machine);
      logger.info(`Machine ${id} updated`);
    } else {
      await addMachine(turtle);
      logger.info(`Machine ${id} accepted`);
    }

    return null;
  }

  async acceptMachine(computer_id: string, data: {cords? : {x : number, y : number, z : number}, facing?: Direction, world_id : string}, client: ClientWebSocket) : Promise<string | null> {
    if (!this.uninitiatedMachines[computer_id]) {
      logger.info(`Machine ${computer_id} does not exist in uninitiated machines`);
      return wsCommands.pass;
    }

    if (!MACHINE_API_KEY) {
      logger.error('Machine API key not set');
      return wsCommands.pass;
    }

    const id = generateMachineID(computer_id, data.world_id);
    const machine = await getMachine(id);
    const ws = this.uninitiatedMachines[computer_id];

    let err = null;
    if (ws.type === 'turtle') {
      err = await this.acceptTurtle(id, machine as Turtle, data);
    }
    else {
      err = "invalid_machine_type";
    }

    if (err) {
      logger.error(`Cannot accept machine ${computer_id}, ${err}`);
      ws.send(JSON.stringify({type: 'initiate', success: false}));
      delete this.uninitiatedMachines[computer_id];
      client.send(JSON.stringify({ type: 'command_error', payload: {command: ClientCommands.initiate_accept_machine, message: err} }));
      return wsCommands.sync_uninitiated_machines_with_clients
    }

    const toSend = {
      type: `initiate`,
      success: true,
      api_key: MACHINE_API_KEY,
      world_id: data.world_id
    }

    ws.send(JSON.stringify(toSend));
    delete this.uninitiatedMachines[computer_id];
    return wsCommands.sync_uninitiated_machines_with_clients
  }

  rejectMachine(id: string) {
    if (!this.uninitiatedMachines[id]) {
      logger.info(`Machine ${id} does not exist in uninitiated machines`);
      return wsCommands.pass;
    }

    const ws = this.uninitiatedMachines[id];
    ws.send("REJECTED");
    delete this.uninitiatedMachines[id];
    logger.info(`Machine ${id} rejected`);
    return wsCommands.sync_uninitiated_machines_with_clients
  }

  sendCommand(machine_id: any, command: string, clientControllerUsername : string | null): string | null {
    if (!this.machines[machine_id]) {
      logger.info(`Machine ${machine_id} does not exist`);
      return wsCommands.pass;
    }

    const ws = this.machines[machine_id];
    ws.send(JSON.stringify({ type: 'command', command: command, initiated_client: clientControllerUsername }));
    return wsCommands.sync_machines_with_clients;
  }
};
