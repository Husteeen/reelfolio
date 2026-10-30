import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, getUserId } from '../middleware/auth';

const router = Router();

// ── GET /api/v1/profile/me ────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(404).json({ success: false, message: 'Profile not found.' });
    return;
  }

  res.json({ success: true, profile });
});

// ── PUT /api/v1/profile/me ────────────────────────────────────────────────────
router.put('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { displayName, bio, avatarUrl, socialLinks, skills, visibility } = req.body;

  // Validate allowed visibility values
  const allowedVisibility = ['PUBLIC', 'PRIVATE'];
  if (visibility && !allowedVisibility.includes(visibility as string)) {
    res.status(400).json({ success: false, message: 'Invalid visibility value.' });
    return;
  }

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      ...(displayName  !== undefined && { displayName:  displayName  as string }),
      ...(bio          !== undefined && { bio:          bio          as string | null }),
      ...(avatarUrl    !== undefined && { avatarUrl:    avatarUrl    as string | null }),
      ...(socialLinks  !== undefined && { socialLinks }),
      ...(skills       !== undefined && { skills:       skills       as string[] }),
      ...(visibility   !== undefined && { visibility:   visibility   as any }),
    },
  });

  res.json({ success: true, profile: updated });
});

// ── GET /api/v1/profile/:username (public) ────────────────────────────────────
router.get('/:username', async (req: Request, res: Response): Promise<void> => {
  const username = req.params['username'] as string;

  const profile = await prisma.profile.findUnique({
    where:   { username },
    include: { user: { select: { id: true, createdAt: true } } },
  });

  if (!profile || profile.visibility === 'PRIVATE') {
    res.status(404).json({ success: false, message: 'Profile not found.' });
    return;
  }

  // Strip internal fields before sending
  const { userId: _uid, ...publicProfile } = profile;
  res.json({ success: true, profile: publicProfile });
});

export default router;
