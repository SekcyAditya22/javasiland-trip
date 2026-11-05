import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { createApiClient } from './helpers/api.js';

test('package and fleet galleries persist, preserve order, and reach the public catalog', async () => {
  const prefix = `gallery-test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const images = Array.from(
    { length: 7 },
    (_, index) => `https://example.com/${prefix}-${index}.jpg`,
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie;
  let vehicleId;
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
    const packageBody = {
      id: prefix,
      slug: prefix,
      title: prefix,
      area: 'Jogja',
      image: images[0],
      gallery: images.slice(1),
      status: 'PUBLISHED',
    };
    const created = await request('/admin/packages', 'POST', packageBody);
    assert.equal(created.status, 201);
    assert.deepEqual(created.data.gallery, images.slice(1));
    const gallery = images.slice(1).reverse();
    const updated = await request(`/admin/packages/${prefix}`, 'PUT', {
      ...packageBody,
      gallery: [...gallery, gallery[0]],
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(updated.data.gallery, gallery);
    assert.equal(
      (
        await request(`/admin/packages/${prefix}`, 'PUT', {
          ...packageBody,
          gallery: ['javascript:alert(1)'],
        })
      ).status,
      400,
    );
    const { gallery: _gallery, ...legacyBody } = packageBody;
    assert.equal(
      (await request(`/admin/packages/${prefix}`, 'PUT', legacyBody)).status,
      200,
    );
    assert.deepEqual(
      (await prisma.package.findUnique({ where: { id: prefix } })).gallery,
      gallery,
    );
    const vehicleBody = {
      name: prefix,
      type: 'MPV',
      image: images[0],
      gallery: images.slice(1),
      capacity: 6,
      from: 700000,
      rates: [{ serviceType: 'driver_only', durationHours: 12, price: 750000 }],
    };
    const vehicle = await request('/admin/fleet', 'POST', vehicleBody);
    assert.equal(vehicle.status, 201);
    vehicleId = vehicle.data.id;
    assert.equal(
      (
        await request(`/admin/fleet/${vehicleId}`, 'PUT', {
          ...vehicleBody,
          gallery,
        })
      ).status,
      200,
    );
    const catalog = (await request('/public/bootstrap')).data;
    assert.deepEqual(
      catalog.packages.find((item) => item.id === prefix).gallery,
      gallery,
    );
    const publicVehicle = catalog.fleet.find((item) => item.id === vehicleId);
    assert.deepEqual(publicVehicle.gallery, gallery);
    assert.equal(publicVehicle.rates[0].price, 750000);
    const adminCatalog = (await request('/admin/dashboard')).data.catalog;
    assert.deepEqual(
      adminCatalog.fleet.find((item) => item.id === vehicleId).gallery,
      gallery,
    );
    const { gallery: _vehicleGallery, ...legacyVehicleBody } = vehicleBody;
    assert.equal(
      (await request(`/admin/fleet/${vehicleId}`, 'PUT', legacyVehicleBody))
        .status,
      200,
    );
    assert.deepEqual(
      (await prisma.vehicle.findUnique({ where: { id: vehicleId } })).gallery,
      gallery,
    );
    assert.equal(
      (
        await request(`/admin/fleet/${vehicleId}`, 'PUT', {
          ...vehicleBody,
          gallery: 'not-an-array',
        })
      ).status,
      400,
    );
  } finally {
    await prisma.package.deleteMany({ where: { id: prefix } });
    if (vehicleId)
      await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    await prisma.adminUser.deleteMany({ where: { username: prefix } });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
