import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, getUserId } from '../middleware/auth';
import multer, { FileFilterCallback } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['video/mp4','video/webm','video/quicktime','video/x-msvideo','image/jpeg','image/png','image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type.'));
  },
});

function bufferToStream(buffer: Buffer): Readable {
  const s = new Readable(); s.push(buffer); s.push(null); return s;
}

// ── POST /api/v1/upload/video ─────────────────────────────────────────────────
router.post('/video', requireAuth, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) { res.status(400).json({ success: false, message: 'No file uploaded.' }); return; }

  const userId = getUserId(req);
  try {
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: `reelfolio/${userId}` },
        (err: unknown, res: Record<string, unknown> | undefined) => {
          if (err || !res) reject(err ?? new Error('Upload failed'));
          else resolve(res);
        }
      );
      bufferToStream(file.buffer).pipe(stream);
    });

    const url = result['secure_url'] as string;
    // Generate a thumbnail by replacing video extension with .jpg using Cloudinary's poster frame
    const thumbnailUrl = url.replace(/\.(mp4|webm|mov|avi)$/i, '.jpg')
                            .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill/');

    res.status(201).json({
      success:      true,
      url,
      publicId:     result['public_id'],
      thumbnailUrl,
      duration:     result['duration'] ?? null,
    });
  } catch (err) {
    console.error('Video upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
});

// ── POST /api/v1/upload/avatar ────────────────────────────────────────────────
router.post('/avatar', requireAuth, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) { res.status(400).json({ success: false, message: 'No file uploaded.' }); return; }

  const userId = getUserId(req);
  try {
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'reelfolio/avatars', public_id: `avatar_${userId}`, overwrite: true, transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
        (err: Error | undefined, res: Record<string, unknown> | undefined) => { if (err || !res) reject(err); else resolve(res); }
      );
      bufferToStream(file.buffer).pipe(stream);
    });

    const avatarUrl = result['secure_url'] as string;
    await prisma.profile.update({ where: { userId }, data: { avatarUrl } });
    res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: 'Avatar upload failed.' });
  }
});

export default router;
