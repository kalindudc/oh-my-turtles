import { JsonDB, Config } from 'node-json-db';

enum BlockType {
  PERIPHERAL = 'peripheral',
  STATIC = 'static',
}

export type Block = {
  id: string;
  x: number;
  y: number;
  z: number;
  type: BlockType;
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

export async function addBlock(worldId: string, newBlock: Block) {
  (await dbWorld.getData("/worlds")).find((world: World) => world.id === worldId).blocks.push(newBlock);
  return newBlock;
}

export async function updateBlock(worldId: string, blockId: string, updatedBlock: Block) {
  const worldIndex = await dbWorld.getIndex("/worlds", worldId);
  const blockIndex = await dbWorld.getIndex(`/worlds[${worldIndex}]/blocks`, blockId);
  await dbWorld.push(`/worlds[${worldIndex}]/blocks[${blockIndex}]`, updatedBlock);
  return updatedBlock;
}

export async function deleteBlock(worldId: string, blockId: string) {
  const worldIndex = await dbWorld.getIndex("/worlds", worldId);
  const blockIndex = await dbWorld.getIndex(`/worlds[${worldIndex}]/blocks`, blockId);
  return await dbWorld.delete(`/worlds[${worldIndex}]/blocks[${blockIndex}]`);
}
