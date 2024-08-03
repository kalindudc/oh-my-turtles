import express from 'express';
import path from 'path';

import { generateSetup } from '../templates/setup.lua';
import createTaggedLogger from '../logger';

const logger = createTaggedLogger(path.basename(__filename));

const router = express.Router();


router.get('/generateSetup', (_, res) => {
  const data = {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || '8080'
  }

  res.set('Content-Type', 'text/plain')
  res.status(200).send(generateSetup(data));
});

export { router as basicRoutes };
