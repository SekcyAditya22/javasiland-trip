import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { createApiClient } from './helpers/api.js';

test('deleting variants preserves retained IDs and bookings, and allows an empty variant list', async () => {
  const prefix = `variant-test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie;
  const send = createApiClient(base);
  const request = (path, method = 'GET', body) =>
    send(path, { cookie, method, body });
  try {
    await prisma.adminUser.create({
      data: {
        username: prefix,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'OWNER',
      },
    });
    cookie = (
      await request('/auth/login', 'POST', { username: prefix, password })
    ).cookie;
    const body = {
      id: prefix,
      slug: prefix,
      title: prefix,
      area: 'Jogja',
      variantDetails: ['A', 'B', 'C'].map((code) => ({
        code,
        title: `Variant ${code}`,
        itinerary: [`Itinerary ${code}`],
        priceTiers: [{ pax: 2, price: 500000 }],
      })),
    };
    const created = await request('/admin/packages', 'POST', body);
    assert.equal(created.status, 201);
    const [a, b, c] = ['A', 'B', 'C'].map((code) =>
      created.data.variants.find((variant) => variant.code === code),
    );
    for (const variant of [a, b])
      await prisma.booking.create({
        data: {
          id: `${prefix}-${variant.code}`,
          packageId: prefix,
          variantId: variant.id,
          variantTitle: variant.title,
          name: prefix,
          phone: '0800000000',
          date: '2026-11-02',
          notes: '',
        },
      });
    const retained = [body.variantDetails[0], body.variantDetails[2]].map(
      (variant, index) => ({ ...variant, id: index === 0 ? a.id : c.id }),
    );
    const updated = await request(`/admin/packages/${prefix}`, 'PUT', {
      ...body,
      variantDetails: retained,
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(
      updated.data.variants.map((variant) => variant.id).sort(),
      [a.id, c.id].sort(),
    );
    assert.equal(
      await prisma.packageVariant.findUnique({ where: { id: b.id } }),
      null,
    );
    assert.equal(
      (await prisma.booking.findUnique({ where: { id: `${prefix}-A` } }))
        .variantId,
      a.id,
    );
    const deletedBooking = await prisma.booking.findUnique({
      where: { id: `${prefix}-B` },
    });
    assert.equal(deletedBooking.variantId, null);
    assert.equal(deletedBooking.variantTitle, b.title);
    const invalid = await request(`/admin/packages/${prefix}`, 'PUT', {
      ...body,
      variantDetails: retained.map((variant) => ({ ...variant, code: 'A' })),
    });
    assert.equal(invalid.status, 400);
    assert.equal(
      await prisma.packageVariant.count({ where: { packageId: prefix } }),
      2,
    );
    const swapped = await request(`/admin/packages/${prefix}`, 'PUT', {
      ...body,
      variantDetails: retained.map((variant, index) => ({
        ...variant,
        code: index === 0 ? 'C' : 'A',
      })),
    });
    assert.equal(swapped.status, 200);
    assert.equal(
      swapped.data.variants.find((variant) => variant.id === a.id).code,
      'C',
    );
    const empty = await request(`/admin/packages/${prefix}`, 'PUT', {
      ...body,
      variantDetails: [],
    });
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.data.variants, []);
    const catalog = (await request('/admin/dashboard')).data.catalog;
    assert.deepEqual(
      catalog.packages.find((item) => item.id === prefix).variantDetails,
      [],
    );
    assert.equal(
      await prisma.booking.count({ where: { packageId: prefix } }),
      2,
    );
  } finally {
    await prisma.booking.deleteMany({ where: { packageId: prefix } });
    await prisma.package.deleteMany({ where: { id: prefix } });
    await prisma.adminUser.deleteMany({ where: { username: prefix } });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
