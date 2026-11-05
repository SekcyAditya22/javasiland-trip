import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { mediaData, mapMedia } from '../lib/media.js';

const router = Router();
router.use(requireAdmin);
router.put('/:key', async (req, res, next) => {
  try {
    if (!/^[a-z0-9_-]{1,80}$/.test(req.params.key))
      return res.status(400).json({ message: 'Section tidak valid.' });
    const body = req.body ?? {};
    const fields = ['title', 'enTitle', 'body', 'enBody'];
    if (
      fields.some(
        (key) =>
          body[key] !== undefined &&
          (typeof body[key] !== 'string' ||
            body[key].length >
              (key.toLowerCase().includes('title') ? 180 : 20000)),
      )
    )
      return res
        .status(400)
        .json({ message: 'Konten section tidak valid atau terlalu panjang.' });
    const sortOrder = Number(body.sortOrder || 0);
    if (!Number.isSafeInteger(sortOrder) || Math.abs(sortOrder) > 100000)
      return res.status(400).json({ message: 'Urutan section tidak valid.' });
    const data = {
      ...Object.fromEntries(fields.map((key) => [key, body[key] || ''])),
      ...mediaData(body),
      sortOrder,
      visible: body.visible !== false,
    };
    const item = await prisma.homepageSection.upsert({
      where: { sectionKey: req.params.key },
      update: data,
      create: { sectionKey: req.params.key, ...data },
    });
    res.json({ ...item, ...mapMedia(item) });
  } catch (error) {
    if (error.status === 400 || error.message?.includes('galeri'))
      return res.status(400).json({ message: error.message });
    next(error);
  }
});
export default router;
