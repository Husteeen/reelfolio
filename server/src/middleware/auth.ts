import { Request, Response, NextFunction } from 'express';

// Extend express-session to include our userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

/** Require an authenticated session — returns 401 otherwise */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    return;
  }
  next();
}

/** Attach req.userId shorthand (call after requireAuth) */
export function getUserId(req: Request): string {
  return req.session!.userId!;
}
