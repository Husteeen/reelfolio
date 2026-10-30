import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth, getUserId } from '../middleware/auth';

const router = Router();

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, username, email, password } = req.body;

  // Server-side validation
  if (!name || !username || !email || !password) {
    res.status(400).json({ success: false, message: 'All fields are required.' });
    return;
  }
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    res.status(400).json({ success: false, message: 'Username must be 3-30 lowercase letters, numbers, or underscores.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email address.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    return;
  }

  // Check uniqueness
  const existingEmail    = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return;
  }
  const existingUsername = await prisma.profile.findUnique({ where: { username } });
  if (existingUsername) {
    res.status(409).json({ success: false, message: 'This username is already taken.' });
    return;
  }

  // Hash password (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user + profile in a transaction
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          username,
          displayName: name,
        },
      },
    },
    include: { profile: true },
  });

  // Start session
  req.session.userId = user.id;

  res.status(201).json({
    success: true,
    user: {
      id:          user.id,
      email:       user.email,
      role:        user.role,
      username:    user.profile!.username,
      displayName: user.profile!.displayName,
    },
  });
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  // Always run bcrypt comparison to avoid timing attacks
  const hash = user?.passwordHash ?? '$2a$12$invalidhashpadding000000000000000000000000000000000000';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  req.session.userId = user.id;

  res.json({
    success: true,
    user: {
      id:          user.id,
      email:       user.email,
      role:        user.role,
      username:    user.profile?.username,
      displayName: user.profile?.displayName,
    },
  });
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Could not log out.' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out.' });
  });
});

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ success: false, message: 'Session invalid.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id:          user.id,
      email:       user.email,
      role:        user.role,
      username:    user.profile?.username,
      displayName: user.profile?.displayName,
      avatarUrl:   user.profile?.avatarUrl,
    },
  });
});

export default router;
