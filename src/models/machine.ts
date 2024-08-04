import { JsonDB, Config } from 'node-json-db';
import { Item, World } from './world';
import { vec3 } from 'gl-matrix';
import { Dir } from 'fs';


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

const move = (directionVector: vec3, machine: Machine) => {
  const currentPosition = vec3.fromValues(machine.x, machine.y, machine.z);
  vec3.add(currentPosition, currentPosition, directionVector);

  machine.x = currentPosition[0];
  machine.y = currentPosition[1];
  machine.z = currentPosition[2];
}

export const moveForward = (machine: Machine) => {
  move(DIRECTION_VECTORS[machine.facing], machine);
}

export const moveBackward = (machine: Machine) => {
  move(DIRECTION_VECTORS[getOppositeDirection(machine.facing)], machine);
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
  move(DIRECTION_VECTORS[Direction.up], machine);
}

export const moveDown = (machine: Machine) => {
  move(DIRECTION_VECTORS[Direction.down], machine);
}

export interface Machine {
  id: string;
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
  name: string;
  x: number;
  y: number;
  z: number;
  facing: Direction;
  world_id: string;
  fuel: number;
  inventory: Array<Item>;
  type: string;

  constructor(id: string, name: string, world_id: string, fuel: number, inventory: Array<Item>) {
    this.id = id;
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

const dbMachine = new JsonDB(new Config('src/db/machine.json', true, false, '/'));

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
