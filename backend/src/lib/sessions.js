import crypto from 'node:crypto';
import { prisma } from './prisma.js';
import { env } from '../config/env.js';

export const SESSION_COOKIE = 'jit_admin_session';
const validToken = (token) =>
  typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
export const sessionDigest = (token) =>
  `sha256:${crypto.createHash('sha256').update(token).digest('hex')}`;
const tokenKeys = (token) =>
  validToken(token) ? [sessionDigest(token), token] : [];
const withAdmin = {
  admin: { select: { id: true, username: true, role: true, active: true } },
};

export const sessionCookieOptions = (req) => ({
  httpOnly: true,
  path: '/',
  sameSite: env.cookieSameSite,
  secure:
    env.cookieSecure === true || (env.cookieSecure === 'auto' && req.secure),
});
export const csrfForSession = (token) =>
  crypto
    .createHmac('sha256', env.sessionSecret)
    .update(`csrf:${token}`)
    .digest('hex');
export function validSessionCsrf(req) {
  const supplied = req.get('X-CSRF-Token');
  const token = req.cookies?.[SESSION_COOKIE];
  return (
    validToken(token) &&
    validToken(supplied) &&
    crypto.timingSafeEqual(
      Buffer.from(supplied, 'hex'),
      Buffer.from(csrfForSession(token), 'hex'),
    )
  );
}
export const csrfFailure = (res) =>
  res
    .status(403)
    .json({
      code: 'CSRF_INVALID',
      message: 'Verifikasi sesi perlu diperbarui. Silakan coba kembali.',
    });

export async function createSession(admin, previousToken) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.sessionHours * 3600000);
  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.adminUser.findFirst({
      where: { id: admin.id, active: true, passwordHash: admin.passwordHash },
      select: { id: true, username: true, role: true },
    });
    if (!current)
      throw Object.assign(new Error('Username atau password salah.'), {
        status: 401,
      });
    await tx.adminSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          { token: { in: tokenKeys(previousToken) } },
        ],
      },
    });
    await tx.loginThrottle.deleteMany({
      where: { resetAt: { lte: new Date() } },
    });
    await tx.adminSession.create({
      data: {
        token: sessionDigest(token),
        username: current.username,
        adminId: current.id,
        expiresAt,
      },
    });
    return current;
  });
  return { token, user };
}

export async function removeSession(token) {
  if (!validToken(token)) return;
  await prisma.adminSession.deleteMany({
    where: { token: { in: tokenKeys(token) } },
  });
}

export async function getSession(token) {
  if (!validToken(token)) return null;
  let session = await prisma.adminSession.findUnique({
    where: { token: sessionDigest(token) },
    include: withAdmin,
  });
  if (!session) {
    // Upgrade existing sessions without changing the browser cookie or account.
    const legacy = await prisma.adminSession.findUnique({
      where: { token },
      include: withAdmin,
    });
    if (legacy) {
      try {
        await prisma.adminSession.updateMany({
          where: { token },
          data: { token: sessionDigest(token) },
        });
      } catch (error) {
        if (error.code !== 'P2002') throw error;
      }
      session = await prisma.adminSession.findUnique({
        where: { token: sessionDigest(token) },
        include: withAdmin,
      });
    }
  }
  if (!session || session.expiresAt <= new Date() || !session.admin?.active) {
    if (session)
      await prisma.adminSession.deleteMany({ where: { token: session.token } });
    return null;
  }
  return session;
}
