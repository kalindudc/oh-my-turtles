import { JsonDB, Config } from 'node-json-db';
import bcrypt from 'bcrypt';

import { config } from '../config';

export type User = {
  id: string;
  password: string;
};

const db = new JsonDB(new Config(config.database.users.path, true, false, '/'));

export async function initializeUserDB() {
  try {
    var data = await db.getData("/");
    if (!data.users) {
      db.push("/",  { users: [] });
    }
  } catch(error) {
      console.error(error);
  };
}

export async function getUsers() {
  return await db.getData("/users");
}

export async function getUser(id: string) {
  return (await db.getData("/users")).find((user: User) => user.id === id);
}

export async function addUser(user: User) {
  await db.push("/users[]", user);
  return user;
}

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export async function updateUser(user: User) {
  const users = await getUsers();
  const index = users.findIndex((u: User) => u.id === user.id);
  if (index === -1) {
    return;
  }

  return db.push(`/users[${index}]`, user);
}

export async function deleteUser(id: string) {
  const users = await getUsers();
  const index = users.findIndex((u: User) => u.id === id);
  if (index === -1) {
    return;
  }

  return db.delete(`/users[${index}]`);
}
