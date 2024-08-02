import express, { Request, Response, NextFunction } from 'express';
import { getUser, comparePassword } from '../models/user';

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

router.get('/profile', isAuthenticated, (req: Request, res: Response) => {
  const user = req.session.user as { username: string };
  const username = Buffer.from(user.username, 'base64').toString('ascii');
  res.status(200).json({ username });
});

export { router as userRoutes };
