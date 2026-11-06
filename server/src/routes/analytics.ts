import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// ── GET /api/v1/analytics/:username ──────────────────────────────────────────
// Increment view count + return portfolio stats
router.post('/view/:username', async (req: Request, res: Response): Promise<void> => {
  const username = req.params['username'] as string;

  const profile = await prisma.profile.findUnique({ where: { username } });
  if (!profile || profile.visibility === 'PRIVATE') {
    res.status(404).json({ success: false, message: 'Profile not found.' });
    return;
  }

  // Increment view count
  await prisma.profile.update({
    where: { username },
    data:  { viewCount: { increment: 1 } },
  });

  res.json({ success: true });
});

// ── GET /api/v1/analytics/me ──────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { viewCount: true, username: true, displayName: true },
  });

  const [total, published, drafts] = await Promise.all([
    prisma.video.count({ where: { userId: session.userId } }),
    prisma.video.count({ where: { userId: session.userId, status: 'PUBLISHED' } }),
    prisma.video.count({ where: { userId: session.userId, status: 'DRAFT' } }),
  ]);

  res.json({
    success: true,
    stats: {
      viewCount:      profile?.viewCount ?? 0,
      totalVideos:    total,
      publishedVideos: published,
      draftVideos:    drafts,
    },
  });
});

export default router;
