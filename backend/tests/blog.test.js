import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { getBlogSettings, saveBlogSettings } from '../src/data/blog.js';
import { createApiClient } from './helpers/api.js';

test('blog CRUD, publication, homepage selection, and anonymous view deduplication', async () => {
  const prefix = `blog-test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const original = await getBlogSettings();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = createApiClient(base);
  try {
    const owner = await prisma.adminUser.create({
      data: {
        username: prefix,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'OWNER',
      },
    });
    assert.equal((await request('/admin/blog')).status, 401);
    assert.equal(
      (await request('/admin/blog', { method: 'POST', body: {} })).status,
      401,
    );
    const { cookie } = await request('/auth/login', {
      method: 'POST',
      body: { username: owner.username, password },
    });
    const post = {
      title: `${prefix} story`,
      slug: `${prefix}-draft`,
      content: '## A journey\n\nA meaningful story with **local tips**.',
      status: 'DRAFT',
      category: prefix,
      image: `https://example.com/cover.jpg?caption=${'a'.repeat(300)}`,
    };
    assert.equal(
      (
        await request('/admin/blog', {
          cookie,
          method: 'POST',
          body: { ...post, slug: '../bad' },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('/admin/blog', {
          cookie,
          method: 'POST',
          body: { ...post, image: 'javascript:alert(1)' },
        })
      ).status,
      400,
    );
    const created = await request('/admin/blog', {
      cookie,
      method: 'POST',
      body: { ...post, views: 999999 },
    });
    assert.equal(created.status, 201);
    assert.equal(
      created.data.image,
      post.image,
      'cover URLs longer than 191 characters persist',
    );
    assert.equal(
      created.data.views,
      0,
      'views cannot be written by an article payload',
    );
    assert.equal(
      (await request('/admin/blog', { cookie, method: 'POST', body: post }))
        .status,
      409,
    );
    assert.equal(
      (await request(`/admin/blog/${created.data.id}`, { cookie })).data
        .content,
      post.content,
    );
    assert.equal(
      (await request('/admin/blog', { cookie })).data.posts.some(
        (item) => item.id === created.data.id,
      ),
      true,
    );
    assert.equal((await request(`/public/blog/${post.slug}`)).status, 404);
    assert.equal(
      (await request(`/public/blog/${post.slug}/view`, { method: 'POST' }))
        .status,
      404,
    );

    const publish = {
      ...post,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 2000).toISOString(),
    };
    const published = await request(`/admin/blog/${created.data.id}`, {
      cookie,
      method: 'PUT',
      body: publish,
    });
    assert.equal(published.status, 200);
    assert.ok(published.data.excerpt.length > 10);
    const older = (
      await request('/admin/blog', {
        cookie,
        method: 'POST',
        body: {
          ...publish,
          slug: `${prefix}-older`,
          title: `${prefix} older`,
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      })
    ).data;
    const draft = (
      await request('/admin/blog', {
        cookie,
        method: 'POST',
        body: { ...post, slug: `${prefix}-hidden` },
      })
    ).data;
    const future = (
      await request('/admin/blog', {
        cookie,
        method: 'POST',
        body: {
          ...publish,
          slug: `${prefix}-scheduled`,
          publishedAt: new Date(Date.now() + 86400000).toISOString(),
        },
      })
    ).data;
    assert.equal((await request(`/public/blog/${future.slug}`)).status, 404);
    const listing = await request(
      `/public/blog?category=${prefix}&q=${prefix}`,
    );
    assert.equal(listing.data.total, 2);
    assert.deepEqual(
      listing.data.posts.map((item) => item.id),
      [published.data.id, older.id],
    );
    assert.equal('content' in listing.data.posts[0], false);
    const detail = await request(`/public/blog/${post.slug}`);
    assert.equal(detail.data.post.content, post.content);
    assert.deepEqual(
      detail.data.related.map((item) => item.id),
      [older.id],
    );
    assert.equal(
      detail.data.post.views,
      0,
      'GET and prefetch do not increment views',
    );

    const first = await request(`/public/blog/${post.slug}/view`, {
      method: 'POST',
    });
    assert.equal(first.data.views, 1);
    assert.ok(first.cookie.startsWith('jit_blog_visitor='));
    const repeats = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(`/public/blog/${post.slug}/view`, {
          method: 'POST',
          cookie: first.cookie,
        }),
      ),
    );
    assert.ok(repeats.every((item) => item.data.views === 1));
    assert.equal(
      (await request(`/public/blog/${post.slug}/view`, { method: 'POST' })).data
        .views,
      2,
    );
    assert.equal(
      await prisma.blogView.count({ where: { postId: created.data.id } }),
      2,
    );

    const settings = {
      ...original,
      visible: true,
      limit: 2,
      selectedIds: [older.id, draft.id, published.data.id, future.id],
    };
    const configure = async (mode, extra = {}) => {
      const result = await request('/admin/blog/settings', {
        cookie,
        method: 'PUT',
        body: { ...settings, mode, ...extra },
      });
      assert.equal(result.status, 200, JSON.stringify(result.data));
      return (await request('/public/bootstrap')).data.blog;
    };
    const manual = await configure('MANUAL');
    assert.deepEqual(
      manual.posts.map((item) => item.id),
      [older.id, published.data.id],
      'manual order skips draft and future publications',
    );
    assert.equal('selectedIds' in manual.settings, false);
    const latest = await configure('LATEST');
    const expectedLatest = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 2,
    });
    assert.deepEqual(
      latest.posts.map((item) => item.id),
      expectedLatest.map((item) => item.id),
    );
    await prisma.blogPost.update({
      where: { id: older.id },
      data: { views: 1000000 },
    });
    assert.equal((await configure('POPULAR')).posts[0].id, older.id);
    const random = await configure('RANDOM');
    assert.equal(random.posts.length, 2);
    assert.equal(new Set(random.posts.map((item) => item.id)).size, 2);
    assert.ok(
      random.posts.every(
        (item) =>
          item.status === 'PUBLISHED' &&
          new Date(item.publishedAt) <= new Date(),
      ),
    );
    assert.deepEqual((await configure('LATEST', { visible: false })).posts, []);
    assert.equal(
      (await request(`/public/blog/${post.slug}`)).status,
      200,
      'hiding the section keeps blog pages available',
    );
    assert.equal(
      (
        await request('/admin/blog/settings', {
          cookie,
          method: 'PUT',
          body: { ...settings, mode: 'INVALID' },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('/admin/blog/settings', {
          cookie,
          method: 'PUT',
          body: { ...settings, mode: 'LATEST', limit: 10 },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('/admin/blog/settings', {
          cookie,
          method: 'PUT',
          body: { ...settings, mode: 'MANUAL', selectedIds: [2147483647] },
        })
      ).status,
      400,
    );
    await configure('MANUAL');
    assert.equal(
      (
        await request(`/admin/blog/${published.data.id}`, {
          cookie,
          method: 'DELETE',
        })
      ).status,
      204,
    );
    assert.equal((await request(`/public/blog/${post.slug}`)).status, 404);
    assert.equal(
      await prisma.blogView.count({ where: { postId: published.data.id } }),
      0,
    );
    assert.equal(
      (await getBlogSettings()).selectedIds.includes(published.data.id),
      false,
    );
  } finally {
    const { id, selectedIds, ...settings } = original;
    await saveBlogSettings(settings, selectedIds);
    await prisma.blogPost.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await prisma.adminUser.deleteMany({ where: { username: prefix } });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
