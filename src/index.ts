// src/server.ts
import bodyParser from 'body-parser';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { WebSocketServer } from 'ws';

import { config } from './config';
import createTaggedLogger from './logger/logger';
import { initializeMachineDB } from './models/machine';
import { initializeUserDB } from './models/user';
import { initializeWorldDB } from './models/world';
import { adminRoutes } from './routes/adminRoutes';
import { userRoutes } from './routes/authRoutes';
import { basicRoutes } from './routes/basicRoutes';
import { handleWebSocket } from './websockets/wsHandler';

const PORT = config.server.port;

const logger = createTaggedLogger(path.basename(__filename));

declare module 'express-session' {
  interface SessionData {
    user: {
      username: string;
    };
  }
}

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// get session secret from environment variable
const sessionSecret = config.server.sessionSecret;

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
