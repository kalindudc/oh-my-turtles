// src/server.ts
import path from 'path';
import express from 'express';
import session from 'express-session';
import  bodyParser from 'body-parser'
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

import { initializeWorldDB, addWorld, getWorld, World } from './models/world';
import { initializeMachineDB, getMachine, addMachine, Machine, Turtle } from './models/machine';
import { initializeUserDB } from './models/user';
import { userRoutes } from './routes/authRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { basicRoutes } from './routes/basicRoutes';
import { handleWebSocket } from './websockets/wsHandler';
import createTaggedLogger from './logger';

const logger = createTaggedLogger(path.basename(__filename));

declare module 'express-session' {
  interface SessionData {
    user: {
      username: string;
    };
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// get session secret from environment variable
const sessionSecret = process.env.SESSION_SECRET || 'AVERYCOOLSECRET';

// Set up session management
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

// Set up routes
app.use('/api', userRoutes);
app.use('/admin', adminRoutes);
app.use('/basic', basicRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

async function initializeDB() {
  await initializeWorldDB();
  await initializeMachineDB();
  await initializeUserDB();
}

initializeDB().then(() => {
  const server = app.listen(PORT, () => {
    logger.info(`Server is listening on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server });
  wss.on('connection', handleWebSocket);
});
