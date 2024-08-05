import { JsonDB, Config } from 'node-json-db';
import { Mutex } from 'async-mutex';

import { config } from '../config';

export enum BlockType {
  PERIPHERAL = 'peripheral',
  STATIC = 'static',
}

export type Block = {
  id: string;
  x: number;
  y: number;
  z: number;
  type: BlockType;
  is_solid: boolean;
};

export type Item = {
  id: string;
  name: string;
  block?: Block;
};

export type World = {
  id: string;
  name: string;
  blocks: Array<Block>;
}

const db = new JsonDB(new Config(config.database.worlds.path, true, false, '/'));
const writeMutex = new Mutex();

export async function initializeWorldDB() {
  try {
    var data = await db.getData("/");
    if (!data.worlds) {
      db.push("/",  { worlds: [] });
    }
  } catch(error) {
      console.error(error);
  };
}

export async function getWorlds() {
  return await db.getData("/worlds");
}

export async function getWorld(id: string) {
  return (await db.getData("/worlds")).find((world: World) => world.id === id);
}

export async function addWorld(newWorld: { id: string; name: string, blocks: Array<Block> }) {
  await writeMutex.runExclusive(async () => {
    return await db.push("/worlds[]", newWorld);
  });
  return newWorld;
}

async function addBlock(worldIndex: number, block: Block) {
  await writeMutex.runExclusive(async () => {
    return await db.push(`/worlds[${worldIndex}]/blocks[]`, block);
  });
  return block;
}

async function updateBlock(worldIndex: number, blockIndex: number, updatedBlock: Block) {
  await writeMutex.runExclusive(async () => {
    return await db.push(`/worlds[${worldIndex}]/blocks[${blockIndex}]`, updatedBlock);
  });
  return updatedBlock;
}

export async function deleteBlock(worldIndex: number, blockIndex: number) {
  return await writeMutex.runExclusive(async () => {
    return await db.delete(`/worlds[${worldIndex}]/blocks[${blockIndex}]`);
  });
}

export async function addOrUpdateBlock(world_id: string, block: Block) : Promise<string | undefined> {
  const worldIndex = await db.getIndex("/worlds", world_id);
  if (worldIndex === -1) {
    return "World not found";
  }

  const blocks = await db.getData(`/worlds[${worldIndex}]/blocks`);
  const blockIndex = blocks.findIndex((b: Block) => b.x === block.x && b.y === block.y && b.z === block.z);
  if (blockIndex === -1) {
    await addBlock(worldIndex, block);
  } else {
    await updateBlock(worldIndex, blockIndex, block);
  }
  return;
}

export async function deleteOrIgnoreBlock(world_id: string, block: Block) : Promise<string | undefined> {
  const worldIndex = await db.getIndex("/worlds", world_id);
  if (worldIndex === -1) {
    return "World not found";
  }

  const blocks = await db.getData(`/worlds[${worldIndex}]/blocks`);
  const blockIndex = blocks.findIndex((b: Block) => b.x === block.x && b.y === block.y && b.z === block.z);
  if (blockIndex !== -1) {
    await deleteBlock(worldIndex, blockIndex);
  }
  return;
}
