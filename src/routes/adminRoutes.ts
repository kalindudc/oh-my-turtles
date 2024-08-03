import express from 'express';
import path from 'path';
import { addUser, hashPassword } from '../models/user';
import basicAuth from 'basic-auth';
import { generateSetup } from '../templates/setup.lua';
import { MACHINE_API_KEY } from '../websockets/machineWsHandler';
import createTaggedLogger from '../logger/logger';

const logger = createTaggedLogger(path.basename(__filename));

const router = express.Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Middleware for admin authentication
const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let user = basicAuth(req);

  if (!user && req.headers.authorization) {
    const authHeader = req.headers.authorization.split(' ');
    if (authHeader[0] === 'Basic' && authHeader[1]) {
      const base64Credentials = authHeader[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [name, pass] = credentials.split(':');
      user = { name: name.trim(), pass: pass.trim() };
    }
  }

  if (user && user.name === ADMIN_USERNAME && user.pass === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).send('Access denied');
  }
};

// Admin endpoint to create a new user
router.post('/create-user', adminAuth, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'username and password are required' });
    return;
  }

  const hashedPassword = await hashPassword(password);
  await addUser({id: username, password: hashedPassword});

  res.status(201).json({ message: `User ${username} created successfully` });
});

router.get('/setup', adminAuth, (_, res) => {
  if (!MACHINE_API_KEY) {
    res.status(500).send('Machine API key not set');
    return;
  }

  const data = {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || '8080',
    apiKey: MACHINE_API_KEY
  }

  res.set('Content-Type', 'text/plain')
  res.status(200).send(generateSetup(data));
});

export { router as adminRoutes };
