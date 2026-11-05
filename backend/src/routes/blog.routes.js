import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import {
  blogSummary,
  countBlogView,
  getBlogSettings,
  mapBlogPost,
  publishedBlogWhere,
  saveBlogSettings,
} from '../data/blog.js';
import {
  blogPostData,
  blogSettingsData,
  blogError,
} from '../lib/blogValidation.js';
import { requireAdmin } from '../middleware/auth.js';

export const publicBlogRoutes = Router();
export const adminBlogRoutes = Router();
adminBlogRoutes.use(requireAdmin);
const fail = (error, res, next) => {
  if (error.status)
    return res.status(error.status).json({ message: error.message });
  if (error.code === 'P2002')
    return res
      .status(409)
      .json({ message: 'Slug artikel sudah digunakan. Pilih slug lain.' });
  if (error.code === 'P2025')
    return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
  next(error);
};
const postId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw blogError('ID artikel tidak valid.');
  return id;
};

publicBlogRoutes.get('/', async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Math.min(100000, Math.floor(Number(req.query.page) || 1)),
    );
    const limit = 9;
    const q = String(req.query.q || '')
      .trim()
      .slice(0, 100);
    const category = String(req.query.category || '').slice(0, 60);
    const where = {
      ...publishedBlogWhere(),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: ['title', 'enTitle', 'excerpt', 'enExcerpt'].map((key) => ({
              [key]: { contains: q },
            })),
          }
        : {}),
    };
    const [posts, total, groups] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: blogSummary,
        skip: (page - 1) * limit,
        take: limit,
        orderBy:
          req.query.sort === 'popular'
            ? [{ views: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }]
            : [{ publishedAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.blogPost.count({ where }),
      prisma.blogPost.groupBy({
        by: ['category'],
        where: publishedBlogWhere(),
      }),
    ]);
    res.json({
      posts: posts.map(mapBlogPost),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / limit)),
      categories: groups.map((item) => item.category).sort(),
    });
  } catch (error) {
    fail(error, res, next);
  }
});

publicBlogRoutes.get('/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, ...publishedBlogWhere() },
    });
    if (!post)
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    const related = await prisma.blogPost.findMany({
      where: {
        ...publishedBlogWhere(),
        id: { not: post.id },
        category: post.category,
      },
      select: blogSummary,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 3,
    });
    const popular = await prisma.blogPost.findMany({
      where: { ...publishedBlogWhere(), id: { not: post.id } },
      select: blogSummary,
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
      take: 5,
    });
    res.json({
      post: mapBlogPost(post),
      related: related.map(mapBlogPost),
      popular: popular.map(mapBlogPost),
    });
  } catch (error) {
    fail(error, res, next);
  }
});

publicBlogRoutes.post('/:slug/view', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, ...publishedBlogWhere() },
      select: { id: true, views: true },
    });
    if (!post)
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    let visitor = req.cookies?.jit_blog_visitor;
    if (!/^[a-f0-9]{48}$/.test(visitor || '')) {
      visitor = crypto.randomBytes(24).toString('hex');
      res.cookie('jit_blog_visitor', visitor, {
        httpOnly: true,
        path: '/api/public/blog',
        sameSite: env.cookieSameSite,
        secure:
          env.cookieSecure === true ||
          (env.cookieSecure === 'auto' && req.secure),
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
    res.json({ views: await countBlogView(post, visitor) });
  } catch (error) {
    fail(error, res, next);
  }
});

adminBlogRoutes.get('/', async (_req, res, next) => {
  try {
    const [posts, settings] = await Promise.all([
      prisma.blogPost.findMany({
        select: blogSummary,
        orderBy: { updatedAt: 'desc' },
      }),
      getBlogSettings(),
    ]);
    res.json({ posts: posts.map(mapBlogPost), settings });
  } catch (error) {
    fail(error, res, next);
  }
});
adminBlogRoutes.put('/settings', async (req, res, next) => {
  try {
    const { data, selectedIds } = blogSettingsData(req.body ?? {});
    res.json(await saveBlogSettings(data, selectedIds));
  } catch (error) {
    fail(error, res, next);
  }
});
adminBlogRoutes.get('/:id', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: postId(req.params.id) },
    });
    if (!post)
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    res.json(mapBlogPost(post));
  } catch (error) {
    fail(error, res, next);
  }
});
adminBlogRoutes.post('/', async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        mapBlogPost(
          await prisma.blogPost.create({ data: blogPostData(req.body ?? {}) }),
        ),
      );
  } catch (error) {
    fail(error, res, next);
  }
});
adminBlogRoutes.put('/:id', async (req, res, next) => {
  try {
    res.json(
      mapBlogPost(
        await prisma.blogPost.update({
          where: { id: postId(req.params.id) },
          data: blogPostData(req.body ?? {}),
        }),
      ),
    );
  } catch (error) {
    fail(error, res, next);
  }
});
adminBlogRoutes.delete('/:id', async (req, res, next) => {
  try {
    await prisma.blogPost.delete({ where: { id: postId(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    fail(error, res, next);
  }
});
