import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const originOf = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
const trustedOrigins = new Set(
  [...env.frontendOrigins, env.publicBackendUrl].map(originOf).filter(Boolean),
);
export const corsOptions = {
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Requested-With'],
  origin(origin, callback) {
    if (!origin || trustedOrigins.has(originOf(origin)))
      return callback(null, true);
    callback(
      Object.assign(new Error('Origin tidak diizinkan.'), {
        status: 403,
        code: 'ORIGIN_DENIED',
      }),
    );
  },
};
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  strictTransportSecurity: false,
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'"],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        ...(process.env.NODE_ENV === 'production' ? [] : ['http:']),
      ],
      'connect-src': ["'self'", ...trustedOrigins],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': null,
    },
  },
});
export function protectApi(req, res, next) {
  if (req.secure)
    res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  if (/^\/(auth|admin)(\/|$)/.test(req.path)) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path === '/auth/login' && Number(req.get('Content-Length')) > 4096)
    return res
      .status(413)
      .json({ message: 'Ukuran data login terlalu besar.' });
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  if (
    (origin && !trustedOrigins.has(originOf(origin))) ||
    (!origin && referer && !trustedOrigins.has(originOf(referer))) ||
    (!origin && !referer && req.get('Sec-Fetch-Site') === 'cross-site')
  )
    return res
      .status(403)
      .json({
        code: 'ORIGIN_DENIED',
        message: 'Permintaan dari situs ini tidak diizinkan.',
      });
  const hasBody =
    Number(req.get('Content-Length')) > 0 || req.get('Transfer-Encoding');
  if (hasBody && !req.is('application/json'))
    return res
      .status(415)
      .json({ message: 'Gunakan format JSON untuk permintaan API.' });
  next();
}
export const apiLimiter = rateLimit({
  windowMs: 60000,
  limit: env.apiRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: {
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba kembali.',
  },
});
export const loginBurstLimiter = rateLimit({
  windowMs: 60000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message:
      'Terlalu banyak percobaan login. Tunggu satu menit, lalu coba kembali.',
  },
});
