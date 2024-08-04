import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

import { getUser, comparePassword } from '../models/user';
import createTaggedLogger from '../logger/logger';
import { randomUUID } from 'crypto';
import { addApiKey, getApiKey } from '../websockets/clientWsHandler';
import { getUninitiatedMachines, getActiveMachines, getActiveClients } from '../websockets/wsHandler';
import { getMachines } from '../models/machine';
import { connect } from 'http2';

const logger = createTaggedLogger(path.basename(__filename));

const router = express.Router();

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

const getUserFromSession = (req: Request) => {
  const user = req.session.user;

  if (user) {
    return Buffer.from(user.username, 'base64').toString('utf-8');
  }

  return "";
};

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = (await getUser(username));
  if (!user) {
    res.status(401).json({ message: 'Invalid username or password' });
    return;
  }

  const hashedPassword = user.password;
  if (hashedPassword && await comparePassword(password, hashedPassword)) {
    // base64 encode the username
    const encodedUsername = Buffer.from(username).toString('base64');
    req.session.user = { username: encodedUsername };
    res.cookie('session_id', req.sessionID, { httpOnly: true });
    res.status(200).json({ message: 'Login successful', username: username });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ message: 'Error logging out' });
      return;
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.get('/me', isAuthenticated, (req: Request, res: Response) => {
  const username = getUserFromSession(req);
  res.json({ username: username, apiKey: getApiKey(username) });
});

router.get('/getApiKey', isAuthenticated, (req: Request, res: Response) => {
  const username = getUserFromSession(req);
  logger.info(`Generating API key for user: ${username}`);

  // generate a random API key
  const apiKey = Buffer.from(randomUUID()).toString('base64');
  // register the API key with the clientWsHandler
  addApiKey(apiKey, username)
  // return the API key to the client
  res.status(200).json({ apiKey: apiKey });
});

// TODO: add routes to get initial machine sate, initiated and uninitiated

router.get('/get/machines', isAuthenticated, async (req: Request, res: Response) => {
  const username = getUserFromSession(req);
  logger.info(`User: ${username} is requesting machines`);

  // compile uninitiated machines
  const uninitiatedMachineSockets = getUninitiatedMachines();
  const uninitiatedMachines = Object.keys(uninitiatedMachineSockets).map((key) => {
    return { id: key, type: uninitiatedMachineSockets[key].type };
  });

  type MachineType = {
    id: string;
    name: string;
    type: string;
    world_id: string;
  }

  // get machines that are active
  const activeMachines = getActiveMachines();

  // get registered machines
  const machinesFromDb = await getMachines();
  const machines : Array<MachineType> = machinesFromDb.map((machine: any) => {
    return { id: machine.id, name: machine.name, type: machine.type, world_id: machine.world_id, connected: activeMachines[machine.id] !== undefined };
  });
  res.status(200).json({ machines: machines, uninitiated: uninitiatedMachines });
});

export { router as userRoutes };
