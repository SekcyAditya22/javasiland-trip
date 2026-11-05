import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { createApiClient } from './helpers/api.js';

test('blog/homepage galleries retain framing and popular stories exclude drafts, future dates, and the current post', async () => {
  const prefix = `media-test-${randomUUID().slice(0, 8)}`;
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
        role: 'ADMIN',
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    cookie = (
      await request('/auth/login', 'POST', { username: prefix, password })
    ).cookie;
    const sources = [1, 2, 3].map(
      (value) => `https://example.com/${prefix}-${value}.jpg`,
    );
    const media = {
      image: sources[0],
      gallery: sources.slice(1),
      imageSettings: {
        ratio: '4/3',
        items: [
          { src: sources[0], fit: 'cover', x: 27, y: 64, zoom: 1.35 },
          { src: sources[1], fit: 'contain', x: 50, y: 50, zoom: 1 },
        ],
      },
    };
    const body = {
      ...media,
      title: prefix,
      slug: prefix,
      content: 'Perjalanan yang indah bersama tim lokal.',
      status: 'PUBLISHED',
    };
    const created = await request('/admin/blog', 'POST', body);
    assert.equal(created.status, 201);
    assert.deepEqual(created.data.gallery, media.gallery);
    assert.deepEqual(created.data.imageSettings, media.imageSettings);
    const current = (await request(`/public/blog/${prefix}`)).data.post;
    assert.deepEqual(current.imageSettings, media.imageSettings);
    assert.deepEqual(current.gallery, media.gallery);
    assert.equal(
      (
        await request('/admin/blog', 'POST', {
          ...body,
          slug: `${prefix}-bad`,
          gallery: ['javascript:bad'],
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('/admin/blog', 'POST', {
          ...body,
          imageSettings: { ratio: 'bad', items: [] },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('/admin/blog', 'POST', {
          ...body,
          imageSettings: {
            ratio: '1/1',
            items: [{ ...media.imageSettings.items[0], zoom: 9 }],
          },
        })
      ).status,
      400,
    );
    // An older client that only sends the previous fields keeps the gallery.
    const { gallery, imageSettings, ...legacy } = body;
    assert.equal(
      (await request(`/admin/blog/${current.id}`, 'PUT', legacy)).status,
      200,
    );
    assert.deepEqual(
      (await request(`/public/blog/${prefix}`)).data.post.gallery,
      gallery,
    );
    const reordered = {
      ...body,
      image: sources[2],
      gallery: [sources[0], sources[1]],
    };
    assert.equal(
      (await request(`/admin/blog/${current.id}`, 'PUT', reordered)).status,
      200,
    );
    assert.equal(
      (await request(`/public/blog/${prefix}`)).data.post.image,
      sources[2],
    );
    const favorite = (
      await request('/admin/blog', 'POST', {
        ...body,
        slug: `${prefix}-popular`,
      })
    ).data;
    const draft = (
      await request('/admin/blog', 'POST', {
        ...body,
        slug: `${prefix}-draft`,
        status: 'DRAFT',
      })
    ).data;
    const future = (
      await request('/admin/blog', 'POST', {
        ...body,
        slug: `${prefix}-future`,
        publishedAt: new Date(Date.now() + 86400000).toISOString(),
      })
    ).data;
    await prisma.blogPost.updateMany({
      where: { id: { in: [favorite.id, draft.id, future.id] } },
      data: { views: 1000000000 },
    });
    const popular = (await request(`/public/blog/${prefix}`)).data.popular;
    assert.equal(popular[0].id, favorite.id);
    assert.ok(
      popular.every(
        (item) => ![current.id, draft.id, future.id].includes(item.id),
      ),
    );
    assert.equal('content' in popular[0], false);

    const section = {
      ...media,
      title: prefix,
      enTitle: '',
      body: 'Konten homepage uji.',
      enBody: '',
      sortOrder: 99,
      visible: true,
    };
    assert.equal(
      (await request(`/admin/homepage/${prefix}`, 'PUT', section)).status,
      200,
    );
    const publicSection = (
      await request('/public/bootstrap')
    ).data.homepage.find((item) => item.sectionKey === prefix);
    assert.deepEqual(publicSection.gallery, media.gallery);
    assert.deepEqual(publicSection.imageSettings, media.imageSettings);
    assert.equal(
      (
        await request(`/admin/homepage/${prefix}`, 'PUT', {
          ...section,
          gallery: ['data:image/png;base64,bad'],
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(`/admin/homepage/${prefix}`, 'PUT', {
          ...section,
          visible: false,
        })
      ).status,
      200,
    );
    const hidden = (await request('/public/bootstrap')).data;
    assert.equal(
      hidden.homepage.some((item) => item.sectionKey === prefix),
      false,
    );
    assert.equal(hidden.homepageVisibility[prefix], false);
    const adminSection = (
      await request('/admin/dashboard')
    ).data.catalog.homepage.find((item) => item.sectionKey === prefix);
    assert.deepEqual(adminSection.gallery, media.gallery);
    assert.equal(
      (
        await request(`/admin/homepage/${prefix}`, 'PUT', {
          ...section,
          gallery: [],
          image: '',
          imageSettings: { ratio: '16/9', items: [] },
        })
      ).status,
      200,
    );
    assert.deepEqual(
      (await request('/public/bootstrap')).data.homepage.find(
        (item) => item.sectionKey === prefix,
      ).gallery,
      [],
    );
    const cleared = await request(`/admin/homepage/${prefix}`, 'PUT', {
      ...section,
      imageSettings: null,
    });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.data.imageSettings, null);
  } finally {
    await prisma.blogPost.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await prisma.homepageSection.deleteMany({ where: { sectionKey: prefix } });
    await prisma.adminUser.deleteMany({ where: { username: prefix } });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
