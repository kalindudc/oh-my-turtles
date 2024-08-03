import express from 'express';
import path from 'path';

import { generateSetup } from '../templates/setup.lua';
import createTaggedLogger from '../logger/logger';

const logger = createTaggedLogger(path.basename(__filename));

const router = express.Router();


router.get('/generateSetup', (req, res) => {
  // get host and port form HOST header
  const hostHeader = req.headers.host;
  const host = hostHeader ? hostHeader.split(':')[0] : 'localhost';
  const port = hostHeader ? hostHeader.split(':')[1] : '8080';

  const data = {
    host: host || 'localhost',
    port: port || '8080',
  }

  res.set('Content-Type', 'text/plain')
  res.status(200).send(generateSetup(data));
});

export { router as basicRoutes };
