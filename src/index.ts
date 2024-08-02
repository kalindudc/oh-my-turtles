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
import { userRoutes } from './routes/authRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { handleWebSocket } from './websockets/wsHandler';

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

async function initializeDB() {
  await initializeWorldDB();
  await initializeMachineDB();
}

initializeDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server });
  wss.on('connection', handleWebSocket);
});
