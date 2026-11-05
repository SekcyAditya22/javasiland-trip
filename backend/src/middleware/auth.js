import {
  getSession,
  validSessionCsrf,
  csrfFailure,
  SESSION_COOKIE,
} from '../lib/sessions.js';

export function requireOwner(req, res, next) {
  if (req.admin?.admin?.role !== 'OWNER')
    return res
      .status(403)
      .json({ message: 'Hanya Owner yang dapat mengelola pengguna.' });
  next();
}

export async function requireAdmin(req, res, next) {
  try {
    if (req.admin) return next();
    const session = await getSession(req.cookies?.[SESSION_COOKIE]);
    if (!session)
      return res
        .status(401)
        .json({ message: 'Sesi admin tidak valid atau sudah berakhir.' });
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      !validSessionCsrf(req)
    )
      return csrfFailure(res);
    req.admin = session;
    next();
  } catch (error) {
    next(error);
  }
}
