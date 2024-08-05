import { vec3 } from 'gl-matrix';

import { JsonDB, Config } from 'node-json-db';
import { Item, World } from './world';
import { config } from '../config';

export enum Direction {
  north = 'north',
  south = 'south',
  east = 'east',
  west = 'west',
  up = 'up',
  down = 'down',
}

export const DIRECTION_VECTORS : { [key in Direction]: vec3} = {
  [Direction.north]: vec3.fromValues(0, 0, -1), // -z
  [Direction.south]: vec3.fromValues(0, 0, 1),  // +z
  [Direction.east]: vec3.fromValues(1, 0, 0),   // +x
  [Direction.west]: vec3.fromValues(-1, 0, 0),  // -x
  [Direction.up]: vec3.fromValues(0, 1, 0),     // +y
  [Direction.down]: vec3.fromValues(0, -1, 0),  // -y
}

const getOppositeDirection = (direction: Direction) => {
  switch (direction) {
    case Direction.north:
      return Direction.south;
    case Direction.south:
      return Direction.north;
    case Direction.east:
      return Direction.west;
    case Direction.west:
      return Direction.east;
    case Direction.up:
      return Direction.down;
    case Direction.down:
      return Direction.up;
  }
}

export const getNewPosition = (direction: Direction, cords: vec3) => {
  const newCords = vec3.create();
  vec3.add(newCords, cords, DIRECTION_VECTORS[direction]);
  return newCords;
}

const move = (direction: Direction, machine: Machine) => {
  const newPosition = getNewPosition(direction, vec3.fromValues(machine.x, machine.y, machine.z));

  machine.x = newPosition[0];
  machine.y = newPosition[1];
  machine.z = newPosition[2];
}

export const moveForward = (machine: Machine) => {
  move(machine.facing, machine);
}

export const moveBackward = (machine: Machine) => {
  move(getOppositeDirection(machine.facing), machine);
}

export const turnLeft = (machine: Machine) => {
  switch (machine.facing) {
    case Direction.north:
      machine.facing = Direction.west;
      break;
    case Direction.south:
      machine.facing = Direction.east;
      break;
    case Direction.east:
      machine.facing = Direction.north;
      break;
    case Direction.west:
      machine.facing = Direction.south;
      break;
    default:
      break;
  }
}

export const turnRight = (machine: Machine) => {
  switch (machine.facing) {
    case Direction.north:
      machine.facing = Direction.east;
      break;
    case Direction.south:
      machine.facing = Direction.west;
      break;
    case Direction.east:
      machine.facing = Direction.south;
      break;
    case Direction.west:
      machine.facing = Direction.north;
      break;
    default:
      break;
  }
}

export const moveUp = (machine: Machine) => {
  move(Direction.up, machine);
}

export const moveDown = (machine: Machine) => {
  move(Direction.down, machine);
}

export const generateMachineID = (id: string, worldID: string) => {
  return `${worldID}-${id}`;
}

export interface Machine {
  id: string;
  computer_id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  world_id: string;
  type: string;
  facing: Direction
}

export type UninitiatedMachine = {
  id: string;
  type: string;
}

export class Turtle implements Machine {
  id: string;
  computer_id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  facing: Direction;
  world_id: string;
  fuel: number;
  inventory: Array<Item>;
  type: string;

  constructor(computer_id: string, name: string, world_id: string, fuel: number, inventory: Array<Item>) {
    this.id = generateMachineID(computer_id, world_id);
    this.computer_id = computer_id;
    this.name = name;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.world_id = world_id;
    this.fuel = fuel;
    this.inventory = inventory;
    this.type = 'turtle';
    this.facing = Direction.north;
  }
}

const dbMachine = new JsonDB(new Config(config.database.machines.path, true, false, '/'));

export async function initializeMachineDB() {
  try {
    var data = await dbMachine.getData("/");
    if (!data.machines) {
      dbMachine.push("/",  { machines: [] });
    }
  } catch(error) {
      console.error(error);
  };
}

export async function getMachines() {
  return await dbMachine.getData("/machines");
}

export async function getMachine(id: string) {
  return (await dbMachine.getData("/machines")).find((machine: Machine) => machine.id === id);
}

export async function addMachine(newMachine: Machine) {
  await dbMachine.push("/machines[]", newMachine);
  return newMachine;
}

export async function updateMachine(updatedMachine: Machine) {
  const machineIndex = await dbMachine.getIndex("/machines", updatedMachine.id);
  await dbMachine.push(`/machines[${machineIndex}]`, updatedMachine);
  return updatedMachine;
}

export async function deleteMachine(id: string) {
  const machineIndex = await dbMachine.getIndex("/machines", id);
  return await dbMachine.delete(`/machines[${machineIndex}]`);
}
