import { JsonDB, Config } from 'node-json-db';

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

const dbWorld = new JsonDB(new Config('src/db/world.json', true, false, '/'));

export async function initializeWorldDB() {
  try {
    var data = await dbWorld.getData("/");
    if (!data.worlds) {
      dbWorld.push("/",  { worlds: [] });
    }
  } catch(error) {
      console.error(error);
  };
}

export async function getWorlds() {
  return await dbWorld.getData("/worlds");
}

export async function getWorld(id: string) {
  return (await dbWorld.getData("/worlds")).find((world: World) => world.id === id);
}

export async function addWorld(newWorld: { id: string; name: string, blocks: Array<Block> }) {
  await dbWorld.push("/worlds[]", newWorld);
  return newWorld;
}

async function addBlock(worldIndex: number, block: Block) {
  await dbWorld.push(`/worlds[${worldIndex}]/blocks[]`, block);
  return block;
}

async function updateBlock(worldIndex: number, blockIndex: number, updatedBlock: Block) {
  await dbWorld.push(`/worlds[${worldIndex}]/blocks[${blockIndex}]`, updatedBlock);
  return updatedBlock;
}

export async function deleteBlock(worldId: string, blockId: string) {
  const worldIndex = await dbWorld.getIndex("/worlds", worldId);
  const blockIndex = await dbWorld.getIndex(`/worlds[${worldIndex}]/blocks`, blockId);
  return await dbWorld.delete(`/worlds[${worldIndex}]/blocks[${blockIndex}]`);
}

export async function addOrUpdateBlock(world_id: string, block: Block) : Promise<string | undefined> {
  const worldIndex = await dbWorld.getIndex("/worlds", world_id);
  if (worldIndex === -1) {
    return "World not found";
  }

  const blocks = await dbWorld.getData(`/worlds[${worldIndex}]/blocks`);
  const blockIndex = blocks.findIndex((b: Block) => b.x === block.x && b.y === block.y && b.z === block.z);
  if (blockIndex === -1) {
    await addBlock(worldIndex, block);
  } else {
    await updateBlock(worldIndex, blockIndex, block);
  }
  return;
}
