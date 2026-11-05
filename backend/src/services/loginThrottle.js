import crypto from 'node:crypto';
import { ipKeyGenerator } from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const loginThrottleKeys = (ip, username) => {
  const address = ipKeyGenerator(ip || 'unknown');
  return [
    hash(`login-ip:${address}`),
    hash(`login-account:${address}:${username.toLowerCase()}`),
  ];
};
export async function checkLoginThrottle(keys) {
  const attempts = await prisma.loginThrottle.findMany({
    where: { key: { in: keys }, resetAt: { gt: new Date() } },
  });
  const blocked = attempts.filter(
    (attempt) =>
      attempt.failures >=
      (attempt.key === keys[0] ? env.loginIpMaxFailures : env.loginMaxFailures),
  );
  return blocked.length
    ? Math.max(
        1,
        ...blocked.map((attempt) =>
          Math.ceil((attempt.resetAt.getTime() - Date.now()) / 1000),
        ),
      )
    : 0;
}
export async function recordLoginFailure(keys) {
  await prisma.$transaction(async (tx) => {
    const now = new Date();
    const resetAt = new Date(now.getTime() + env.loginWindowMs);
    for (const key of keys) {
      await tx.loginThrottle.updateMany({
        where: { key, resetAt: { lte: now } },
        data: { failures: 0, resetAt },
      });
      await tx.loginThrottle.upsert({
        where: { key },
        create: { key, failures: 1, resetAt },
        update: { failures: { increment: 1 } },
      });
    }
  });
}
export const clearAccountFailures = (keys) =>
  prisma.loginThrottle.deleteMany({ where: { key: keys[1] } });
