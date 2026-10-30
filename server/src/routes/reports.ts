import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, getUserId } from '../middleware/auth';

const router = Router();

// ── POST /api/v1/reports — submit a content report ───────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const reporterUserId = getUserId(req);
  const { videoId, reportedUserId, reason } = req.body;

  if (!reason?.trim()) {
    res.status(400).json({ success: false, message: 'A reason is required.' });
    return;
  }
  if (!videoId && !reportedUserId) {
    res.status(400).json({ success: false, message: 'Provide either a videoId or reportedUserId.' });
    return;
  }

  const report = await prisma.contentReport.create({
    data: {
      reporterUserId,
      videoId:        videoId        ?? null,
      reportedUserId: reportedUserId ?? null,
      reason:         reason.trim(),
    },
  });

  res.status(201).json({ success: true, report });
});

// ── GET /api/v1/reports — admin: list all reports ─────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  // Only admins can view all reports
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Forbidden.' });
    return;
  }

  const reports = await prisma.contentReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      video:       { select: { id: true, title: true } },
      reporter:    { select: { id: true, profile: { select: { username: true } } } },
      reportedUser:{ select: { id: true, profile: { select: { username: true } } } },
    },
  });

  res.json({ success: true, reports });
});

// ── PATCH /api/v1/reports/:id — admin: update report status ──────────────────
router.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const user   = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Forbidden.' });
    return;
  }

  const { status } = req.body as { status: string };
  const allowed = ['PENDING', 'REVIEWED', 'DISMISSED', 'REMOVED'];
  if (!allowed.includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid status.' });
    return;
  }

  const report = await prisma.contentReport.update({
    where: { id: req.params['id'] as string },
    data:  { status: status as any },
  });

  res.json({ success: true, report });
});

export default router;
