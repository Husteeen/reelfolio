import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ReelFolio API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
