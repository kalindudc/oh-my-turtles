import { JsonDB, Config } from 'node-json-db';
import { Item, World } from './world';

export interface Machine {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  world_id: string;
  type: string;
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
  world_id: string;
  fuel: number;
  inventory: Array<Item>;
  type: string;

  constructor(id: string, name: string, x: number, y: number, z: number, world_id: string, fuel: number, inventory: Array<Item>) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.z = z;
    this.world_id = world_id;
    this.fuel = fuel;
    this.inventory = inventory;
    this.type = 'turtle';
  }
}

type MachineData = {
  machines: Array<Machine>;
};

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
