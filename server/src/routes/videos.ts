import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, getUserId } from '../middleware/auth';

const router = Router();

/** Safely cast a query-string value to string (rejects array values) */
const qs = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExternalThumbnail(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

function validateExternalUrl(url: string): boolean {
  return (
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url) ||
    /^https?:\/\/(www\.)?vimeo\.com\//i.test(url)
  );
}

// ── GET /api/v1/videos ────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId    = getUserId(req);
  const statusQ   = qs(req.query.status);
  const categoryQ = qs(req.query.categoryId);
  const searchQ   = qs(req.query.q);

  const videos = await prisma.video.findMany({
    where: {
      userId,
      ...(statusQ   && { status:     statusQ as any }),
      ...(categoryQ && { categoryId: categoryQ }),
      ...(searchQ   && {
        OR: [
          { title:       { contains: searchQ, mode: 'insensitive' } },
          { description: { contains: searchQ, mode: 'insensitive' } },
        ],
      }),
    },
    include: { category: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  res.json({ success: true, videos });
});

// ── POST /api/v1/videos ───────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { title, description, sourceType, sourceUrl, categoryId, status } = req.body as {
    title: string; description?: string; sourceType: string;
    sourceUrl?: string; categoryId?: string; status?: string;
  };

  if (!title?.trim()) {
    res.status(400).json({ success: false, message: 'Title is required.' });
    return;
  }
  if (!['UPLOAD', 'YOUTUBE', 'VIMEO'].includes(sourceType)) {
    res.status(400).json({ success: false, message: 'Invalid source type.' });
    return;
  }

  let thumbnailUrl: string | null = null;
  if (sourceType === 'YOUTUBE' || sourceType === 'VIMEO') {
    if (!sourceUrl || !validateExternalUrl(sourceUrl)) {
      res.status(400).json({ success: false, message: 'A valid YouTube or Vimeo URL is required.' });
      return;
    }
    thumbnailUrl = getExternalThumbnail(sourceUrl);
  }

  const video = await prisma.video.create({
    data: {
      userId,
      title:       title.trim(),
      description: description?.trim() ?? null,
      sourceType:  sourceType as any,
      sourceUrl:   sourceUrl?.trim() ?? null,
      thumbnailUrl,
      status:      (status ?? 'DRAFT') as any,
      ...(categoryId && { categoryId }),
    },
    include: { category: true },
  });

  res.status(201).json({ success: true, video });
});

// ── GET /api/v1/videos/:id ────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const id     = req.params['id'] as string;

  const video = await prisma.video.findUnique({ where: { id }, include: { category: true } });
  if (!video || video.userId !== userId) {
    res.status(404).json({ success: false, message: 'Video not found.' });
    return;
  }

  res.json({ success: true, video });
});

// ── PUT /api/v1/videos/:id ────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const id     = req.params['id'] as string;

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ success: false, message: 'Video not found.' });
    return;
  }

  const { title, description, sourceUrl, categoryId, status, isFeatured, sortOrder } = req.body as {
    title?: string; description?: string; sourceUrl?: string;
    categoryId?: string; status?: string; isFeatured?: boolean; sortOrder?: number;
  };

  let thumbnailUrl = existing.thumbnailUrl;
  if (sourceUrl && sourceUrl !== existing.sourceUrl) {
    thumbnailUrl = getExternalThumbnail(sourceUrl) ?? existing.thumbnailUrl;
  }

  const video = await prisma.video.update({
    where: { id },
    data: {
      ...(title       !== undefined && { title:       title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(sourceUrl   !== undefined && { sourceUrl:   sourceUrl.trim(), thumbnailUrl }),
      ...(categoryId  !== undefined && { categoryId }),
      ...(status      !== undefined && { status:      status as any }),
      ...(isFeatured  !== undefined && { isFeatured }),
      ...(sortOrder   !== undefined && { sortOrder }),
    },
    include: { category: true },
  });

  res.json({ success: true, video });
});

// ── DELETE /api/v1/videos/:id ─────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const id     = req.params['id'] as string;

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ success: false, message: 'Video not found.' });
    return;
  }

  await prisma.video.delete({ where: { id } });
  res.json({ success: true, message: 'Video deleted.' });
});

// ── GET /api/v1/videos/public/:username ───────────────────────────────────────
router.get('/public/:username', async (req: Request, res: Response): Promise<void> => {
  const username = req.params['username'] as string;

  const profile = await prisma.profile.findUnique({ where: { username } });
  if (!profile || profile.visibility === 'PRIVATE') {
    res.status(404).json({ success: false, message: 'Portfolio not found.' });
    return;
  }

  const videos = await prisma.video.findMany({
    where:   { userId: profile.userId, status: 'PUBLISHED' },
    include: { category: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  res.json({ success: true, videos });
});

export default router;
