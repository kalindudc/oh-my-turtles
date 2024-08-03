import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

import { getUser, comparePassword } from '../models/user';
import createTaggedLogger from '../logger';
import { randomUUID } from 'crypto';
import { addApiKey } from '../websockets/clientWsHandler';

const logger = createTaggedLogger(path.basename(__filename));

const router = express.Router();

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
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
    res.status(200).json({ message: 'Login successful' });
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

router.get('/getApiKey', isAuthenticated, (req: Request, res: Response) => {
  if (!req.session.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const username = Buffer.from(req.session.user.username, 'base64').toString('utf-8');
  logger.info(`Generating API key for user: ${username}`);

  // generate a random API key
  const apiKey = Buffer.from(randomUUID()).toString('base64');
  // register the API key with the clientWsHandler
  addApiKey(apiKey, username)
  // return the API key to the client
  res.status(200).json({ apiKey: apiKey });
});

export { router as userRoutes };
