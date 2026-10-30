import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// ── GET /api/v1/categories ────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, categories });
});

export default router;
