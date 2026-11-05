import 'dotenv/config';
import crypto from 'node:crypto';

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const toTrustProxy = (value) => {
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
};

const cookieSecure = ['true', 'false'].includes(process.env.COOKIE_SECURE)
  ? process.env.COOKIE_SECURE === 'true'
  : 'auto';
const numberInRange = (value, fallback, min, max) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : fallback;
};
const configuredSecret = process.env.SESSION_SECRET || '';
const strongSecret =
  configuredSecret.length >= 32 &&
  !/ganti|development-session|change-me/i.test(configuredSecret);
if (process.env.NODE_ENV === 'production' && !strongSecret)
  throw new Error(
    'SESSION_SECRET wajib diisi minimal 32 karakter acak untuk production.',
  );

export const env = {
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 4173),
  frontendOrigins: toList(
    process.env.FRONTEND_ORIGINS ||
      process.env.FRONTEND_ORIGIN ||
      'http://localhost:4172',
  ),
  publicBackendUrl: String(process.env.PUBLIC_BACKEND_URL || '').replace(
    /\/+$/,
    '',
  ),
  trustProxy: toTrustProxy(process.env.TRUST_PROXY),
  cookieSecure,
  cookieSameSite: ['lax', 'strict', 'none'].includes(
    process.env.COOKIE_SAME_SITE,
  )
    ? process.env.COOKIE_SAME_SITE
    : 'lax',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  sessionSecret: strongSecret
    ? configuredSecret
    : crypto.randomBytes(32).toString('hex'),
  sessionHours: numberInRange(process.env.AUTH_SESSION_HOURS, 12, 1, 72),
  loginWindowMs:
    numberInRange(process.env.AUTH_LOGIN_WINDOW_MINUTES, 15, 1, 60) * 60000,
  loginMaxFailures: numberInRange(
    process.env.AUTH_LOGIN_MAX_FAILURES,
    8,
    3,
    30,
  ),
  loginIpMaxFailures: numberInRange(
    process.env.AUTH_LOGIN_IP_MAX_FAILURES,
    60,
    10,
    300,
  ),
  apiRateLimit: numberInRange(
    process.env.API_RATE_LIMIT_PER_MINUTE,
    300,
    60,
    5000,
  ),
};
