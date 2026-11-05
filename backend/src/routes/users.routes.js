import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAdmin, requireOwner } from '../middleware/auth.js';

const router = Router();
const publicFields = { id: true, username: true, role: true, active: true, createdAt: true };
router.use(requireAdmin, requireOwner);

function validate(body, creating) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) throw Object.assign(new Error('Username harus 3–40 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.'), { status: 400 });
  if (!['OWNER', 'ADMIN'].includes(body.role) || typeof body.active !== 'boolean') throw Object.assign(new Error('Role atau status pengguna tidak valid.'), { status: 400 });
  if ((creating || body.password) && (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password, 'utf8') > 72)) throw Object.assign(new Error('Password minimal 8 karakter dan maksimal 72 byte.'), { status: 400 });
  return { username, role: body.role, active: body.active };
}

const handleError = (error, res, next) => {
  if (error.code === 'P2002') return res.status(409).json({ message: 'Username sudah digunakan.' });
  if (error.code === 'P2025') return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
  if (error.status) return res.status(error.status).json({ message: error.message });
  next(error);
};

router.get('/', async (_req, res, next) => {
  try { res.json(await prisma.adminUser.findMany({ select: publicFields, orderBy: { createdAt: 'desc' } })); }
  catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = validate(req.body ?? {}, true);
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    res.status(201).json(await prisma.adminUser.create({ data: { ...data, passwordHash }, select: publicFields }));
  } catch (error) { handleError(error, res, next); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'ID pengguna tidak valid.' });
    const data = validate(req.body ?? {}, false);
    if (id === req.admin.adminId && (!data.active || data.role !== 'OWNER')) return res.status(400).json({ message: 'Anda tidak dapat menonaktifkan atau menurunkan role akun sendiri.' });
    const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 12) : undefined;
    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.adminUser.update({ where: { id }, data: { ...data, ...(passwordHash ? { passwordHash } : {}) }, select: publicFields });
      // Every credential/status change revokes existing sessions, including this account.
      await tx.adminSession.deleteMany({ where: { adminId: id } });
      return updated;
    });
    res.json(user);
  } catch (error) { handleError(error, res, next); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'ID pengguna tidak valid.' });
    if (id === req.admin.adminId) return res.status(400).json({ message: 'Anda tidak dapat menghapus akun sendiri.' });
    await prisma.adminUser.delete({ where: { id } });
    res.status(204).end();
  } catch (error) { handleError(error, res, next); }
});

export default router;
