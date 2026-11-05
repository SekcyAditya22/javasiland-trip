import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';
import { sessionDigest } from '../src/lib/sessions.js';
import { loginThrottleKeys } from '../src/services/loginThrottle.js';
import { createApiClient } from './helpers/api.js';

test('authentication protects sessions, CSRF, origins, uploads, and persistent login throttling', async () => {
  const prefix = `auth-test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const ip = '198.18.22.47';
  const keys = loginThrottleKeys(ip, prefix);
  const unknownKeys = loginThrottleKeys(ip, `${prefix}-missing`);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const send = createApiClient(base);
  const request = (url, options = {}) =>
    send(url, {
      ...options,
      headers: { 'X-Forwarded-For': ip, ...options.headers },
    });
  const login = (body, options = {}) =>
    request('/auth/login', { method: 'POST', body, ...options });
  let uploaded;
  try {
    const admin = await prisma.adminUser.create({
      data: {
        username: prefix,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'OWNER',
      },
    });
    const anonymous = await request('/auth/session');
    assert.equal(anonymous.status, 401);
    assert.match(anonymous.headers.get('cache-control'), /no-store/);
    assert.equal(anonymous.headers.get('x-powered-by'), null);
    assert.equal(anonymous.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(anonymous.headers.get('x-frame-options'), 'DENY');
    assert.equal(
      (
        await login(
          { username: prefix, password },
          { headers: { Origin: 'https://untrusted.invalid' } },
        )
      ).status,
      403,
    );
    const allowedOrigin = env.frontendOrigins[0];
    const preflight = await fetch(`${base}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: allowedOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-csrf-token',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(
      preflight.headers.get('access-control-allow-origin'),
      new URL(allowedOrigin).origin,
    );
    assert.equal(
      preflight.headers.get('access-control-allow-credentials'),
      'true',
    );
    assert.equal(
      (await login({ username: prefix, password: 'x'.repeat(73) })).status,
      400,
    );
    const huge = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: prefix, password: 'x'.repeat(5000) }),
    });
    assert.equal(huge.status, 413);
    const malformed = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad',
    });
    assert.equal(malformed.status, 400);
    const form = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=ignored&password=ignored',
    });
    assert.equal(form.status, 415);

    const authenticated = await login({ username: prefix, password });
    assert.equal(authenticated.status, 200);
    assert.match(authenticated.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(authenticated.headers.get('set-cookie'), /SameSite=Lax/i);
    assert.equal(
      authenticated.headers.get('set-cookie').includes('Domain='),
      false,
    );
    const cookie = authenticated.cookie;
    const rawToken = cookie.split('=')[1];
    assert.ok(
      await prisma.adminSession.findUnique({
        where: { token: sessionDigest(rawToken) },
      }),
    );
    assert.equal(
      await prisma.adminSession.findUnique({ where: { token: rawToken } }),
      null,
    );
    assert.equal(
      bcrypt.getRounds(
        (await prisma.adminUser.findUnique({ where: { id: admin.id } }))
          .passwordHash,
      ),
      12,
    );
    assert.equal('passwordHash' in authenticated.data.user, false);
    const post = {
      title: prefix,
      slug: prefix,
      content: 'Artikel untuk menguji keamanan sesi.',
      status: 'DRAFT',
    };
    assert.equal(
      (
        await request('/admin/blog', {
          cookie,
          method: 'POST',
          body: post,
          headers: { 'X-CSRF-Token': '' },
        })
      ).status,
      403,
    );
    assert.equal(await prisma.blogPost.count({ where: { slug: prefix } }), 0);
    assert.equal(
      (
        await request('/admin/blog', {
          cookie,
          method: 'POST',
          body: post,
          headers: { Origin: 'https://untrusted.invalid' },
        })
      ).status,
      403,
    );
    const created = await request('/admin/blog', {
      cookie,
      method: 'POST',
      body: post,
    });
    assert.equal(created.status, 201);
    const rotated = await login({ username: prefix, password }, { cookie });
    assert.equal(rotated.status, 200);
    assert.notEqual(rotated.cookie, cookie);
    assert.equal((await request('/auth/session', { cookie })).status, 401);
    const stale = await request(`/admin/blog/${created.data.id}`, {
      cookie: rotated.cookie,
      method: 'DELETE',
      headers: { 'X-CSRF-Token': authenticated.data.csrfToken },
    });
    assert.equal(stale.status, 403);
    assert.equal(stale.data.code, 'CSRF_INVALID');
    assert.ok(
      await prisma.blogPost.findUnique({ where: { id: created.data.id } }),
    );
    assert.equal(
      (
        await request('/auth/logout', {
          cookie: rotated.cookie,
          method: 'POST',
          headers: { 'X-CSRF-Token': '' },
        })
      ).status,
      403,
    );

    const spoof = await request('/admin/uploads', {
      cookie: rotated.cookie,
      method: 'POST',
      body: {
        filename: 'spoof.png',
        dataUrl: `data:image/png;base64,${Buffer.from('<script>untrusted()</script>').toString('base64')}`,
      },
    });
    assert.equal(spoof.status, 400);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const validImage = await request('/admin/uploads', {
      cookie: rotated.cookie,
      method: 'POST',
      body: {
        filename: `${prefix}.png`,
        dataUrl: `data:image/png;base64,${png.toString('base64')}`,
      },
    });
    assert.equal(validImage.status, 201);
    uploaded = validImage.data.filename;
    const oversized = await request('/admin/uploads', {
      cookie: rotated.cookie,
      method: 'POST',
      body: {
        dataUrl: `data:image/png;base64,${Buffer.concat([png, Buffer.alloc(1024 * 1024)]).toString('base64')}`,
      },
    });
    assert.equal(oversized.status, 413);
    assert.equal(
      (
        await request('/auth/logout', {
          cookie: rotated.cookie,
          method: 'POST',
        })
      ).status,
      204,
    );
    assert.equal(
      (await request('/auth/session', { cookie: rotated.cookie })).status,
      401,
    );

    const legacyToken = randomBytes(32).toString('hex');
    const legacyCookie = `jit_admin_session=${legacyToken}`;
    await prisma.adminSession.create({
      data: {
        token: legacyToken,
        username: prefix,
        adminId: admin.id,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    assert.equal(
      (await request('/auth/session', { cookie: legacyCookie })).status,
      200,
    );
    assert.equal(
      await prisma.adminSession.findUnique({ where: { token: legacyToken } }),
      null,
    );
    assert.ok(
      await prisma.adminSession.findUnique({
        where: { token: sessionDigest(legacyToken) },
      }),
    );
    assert.equal(
      (
        await request('/auth/session', {
          cookie: `jit_admin_session=${sessionDigest(legacyToken)}`,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request('/auth/session', {
          cookie: `jit_admin_session=${sessionDigest(legacyToken).slice(7)}`,
        })
      ).status,
      401,
    );
    await prisma.adminSession.updateMany({
      where: { adminId: admin.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    assert.equal(
      (await request('/auth/session', { cookie: legacyCookie })).status,
      401,
    );

    const missing = await login({ username: `${prefix}-missing`, password });
    assert.equal(missing.status, 401);
    for (let index = 0; index < env.loginMaxFailures; index++)
      assert.equal(
        (await login({ username: prefix, password: 'incorrect' })).status,
        401,
      );
    assert.ok(
      await prisma.loginThrottle.findUnique({ where: { key: keys[1] } }),
    );
    const blocked = await login({ username: prefix, password });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.data.code, 'LOGIN_THROTTLED');
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    await prisma.loginThrottle.updateMany({
      where: { key: { in: keys } },
      data: { resetAt: new Date(Date.now() - 1000) },
    });
    const recovered = await login({ username: prefix, password });
    assert.equal(recovered.status, 200);
    assert.equal(
      await prisma.loginThrottle.findUnique({ where: { key: keys[1] } }),
      null,
    );
    const secure = await request('/auth/session', {
      cookie: recovered.cookie,
      headers: { 'X-Forwarded-Proto': 'https' },
    });
    assert.match(secure.headers.get('strict-transport-security'), /max-age=/);
  } finally {
    await prisma.blogPost.deleteMany({ where: { slug: prefix } });
    await prisma.adminUser.deleteMany({ where: { username: prefix } });
    await prisma.loginThrottle.deleteMany({
      where: { key: { in: [...keys, ...unknownKeys] } },
    });
    if (uploaded)
      await fs.unlink(
        path.join(
          fileURLToPath(new URL('../uploads/', import.meta.url)),
          uploaded,
        ),
      );
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
