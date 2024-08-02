import express from 'express';
import { addUser, hashPassword } from '../models/user';
import basicAuth from 'basic-auth';

const router = express.Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Middleware for admin authentication
const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = basicAuth(req);

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

export { router as adminRoutes };
