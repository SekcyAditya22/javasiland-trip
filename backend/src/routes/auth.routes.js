import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import {
  createSession,
  getSession,
  removeSession,
  csrfForSession,
  validSessionCsrf,
  csrfFailure,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '../lib/sessions.js';
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearAccountFailures,
  loginThrottleKeys,
} from '../services/loginThrottle.js';
import { loginBurstLimiter } from '../middleware/security.js';
import { env } from '../config/env.js';

const router = Router();

const dummyHash = bcrypt.hashSync('unused-authentication-timing-value', 12);

router.post('/login', loginBurstLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (
      typeof username !== 'string' ||
      !username.trim() ||
      username.length > 80 ||
      typeof password !== 'string' ||
      !password ||
      Buffer.byteLength(password, 'utf8') > 72
    )
      return res
        .status(400)
        .json({ message: 'Username atau password tidak valid.' });
    const keys = loginThrottleKeys(req.ip, username.trim());
    const retryAfter = await checkLoginThrottle(keys);
    if (retryAfter)
      return res
        .set('Retry-After', String(retryAfter))
        .status(429)
        .json({
          code: 'LOGIN_THROTTLED',
          retryAfter,
          message:
            'Terlalu banyak percobaan login yang gagal. Tunggu beberapa saat sebelum mencoba kembali.',
        });
    const admin = await prisma.adminUser.findUnique({
      where: { username: username.trim() },
    });
    const matches = await bcrypt.compare(
      password,
      admin?.passwordHash || dummyHash,
    );
    if (!admin?.active || !matches) {
      await recordLoginFailure(keys);
      return res.status(401).json({ message: 'Username atau password salah.' });
    }
    if (bcrypt.getRounds(admin.passwordHash) < 12) {
      const passwordHash = await bcrypt.hash(password, 12);
      const updated = await prisma.adminUser.updateMany({
        where: { id: admin.id, passwordHash: admin.passwordHash, active: true },
        data: { passwordHash },
      });
      if (!updated.count)
        return res
          .status(401)
          .json({ message: 'Username atau password salah.' });
      admin.passwordHash = passwordHash;
    }
    const { token, user } = await createSession(
      admin,
      req.cookies?.[SESSION_COOKIE],
    );
    await clearAccountFailures(keys);
    res.cookie(SESSION_COOKIE, token, {
      ...sessionCookieOptions(req),
      maxAge: env.sessionHours * 3600000,
    });
    res.json({ user, csrfToken: csrfForSession(token) });
  } catch (error) {
    next(error);
  }
});

router.get('/session', async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    const session = await getSession(token);
    if (!session) {
      if (token) res.clearCookie(SESSION_COOKIE, sessionCookieOptions(req));
      return res.status(401).json({ message: 'Belum login.' });
    }
    res.json({
      user: {
        id: session.admin.id,
        username: session.admin.username,
        role: session.admin.role,
      },
      csrfToken: csrfForSession(token),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if ((await getSession(token)) && !validSessionCsrf(req))
      return csrfFailure(res);
    await removeSession(token);
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
