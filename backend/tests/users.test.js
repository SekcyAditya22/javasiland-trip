import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { createApiClient } from './helpers/api.js';

test('user CRUD, role permissions, and session revocation', async () => {
  const prefix = `test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = createApiClient(`${base}/api`);
  try {
    const owner = await prisma.adminUser.create({
      data: {
        username: `${prefix}-owner`,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'OWNER',
      },
    });
    assert.equal((await request('/admin/users')).status, 401);
    const login = await request('/auth/login', {
      method: 'POST',
      body: { username: owner.username, password },
    });
    assert.equal(login.status, 200);
    const cookie = login.cookie;
    const original = {
      username: `${prefix}-admin`,
      password,
      role: 'ADMIN',
      active: true,
    };
    assert.equal(
      (
        await request('/admin/users', {
          cookie,
          method: 'POST',
          body: { ...original, password: 'short' },
        })
      ).status,
      400,
    );
    const created = await request('/admin/users', {
      cookie,
      method: 'POST',
      body: original,
    });
    assert.equal(created.status, 201);
    assert.equal('passwordHash' in created.data, false);
    const id = created.data.id;
    assert.equal(
      (
        await request('/admin/users', {
          cookie,
          method: 'POST',
          body: original,
        })
      ).status,
      409,
    );
    const stored = await prisma.adminUser.findUnique({ where: { id } });
    assert.notEqual(stored.passwordHash, password);
    assert.equal(await bcrypt.compare(password, stored.passwordHash), true);
    const listing = await request('/admin/users', { cookie });
    assert.equal(
      listing.data.some((user) => user.id === id),
      true,
    );
    assert.equal(
      listing.data.some((user) => 'passwordHash' in user),
      false,
    );
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: original,
    });
    const adminCookie = adminLogin.cookie;
    assert.equal(
      (await request('/auth/session', { cookie: adminCookie })).data.user.role,
      'ADMIN',
    );
    assert.equal(
      (await request('/admin/users', { cookie: adminCookie })).status,
      403,
    );
    assert.equal(
      (
        await request('/admin/users', {
          cookie: adminCookie,
          method: 'POST',
          body: { ...original, username: `${prefix}-forbidden` },
        })
      ).status,
      403,
    );
    assert.equal(
      (await request(`/admin/users/${owner.id}`, { cookie, method: 'DELETE' }))
        .status,
      400,
    );
    assert.equal(
      (
        await request(`/admin/users/${owner.id}`, {
          cookie,
          method: 'PUT',
          body: { username: owner.username, role: 'ADMIN', active: true },
        })
      ).status,
      400,
    );
    const nextPassword = randomUUID();
    assert.equal(
      (
        await request(`/admin/users/${id}`, {
          cookie,
          method: 'PUT',
          body: {
            ...original,
            username: `${prefix}-edited`,
            password: nextPassword,
            active: false,
          },
        })
      ).status,
      200,
    );
    assert.equal(
      (await request('/auth/session', { cookie: adminCookie })).status,
      401,
    );
    assert.equal(
      (
        await request('/auth/login', {
          method: 'POST',
          body: { username: `${prefix}-edited`, password: nextPassword },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request(`/admin/users/${id}`, {
          cookie,
          method: 'PUT',
          body: {
            ...original,
            username: `${prefix}-edited`,
            password: '',
            active: true,
          },
        })
      ).status,
      200,
    );
    const editedLogin = await request('/auth/login', {
      method: 'POST',
      body: { username: `${prefix}-edited`, password: nextPassword },
    });
    assert.equal(editedLogin.status, 200);
    assert.equal(
      (await request(`/admin/users/${id}`, { cookie, method: 'DELETE' }))
        .status,
      204,
    );
    assert.equal(
      (await request('/auth/session', { cookie: editedLogin.cookie })).status,
      401,
    );
    assert.equal(await prisma.adminUser.findUnique({ where: { id } }), null);
  } finally {
    await prisma.adminUser.deleteMany({
      where: { username: { startsWith: prefix } },
    });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
