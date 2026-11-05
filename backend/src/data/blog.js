import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { mapMedia } from '../lib/media.js';
import { blogError } from '../lib/blogValidation.js';

export const publishedBlogWhere = () => ({
  status: 'PUBLISHED',
  publishedAt: { lte: new Date() },
});
export const blogSummary = {
  id: true,
  slug: true,
  title: true,
  enTitle: true,
  excerpt: true,
  enExcerpt: true,
  image: true,
  gallery: true,
  imageSettings: true,
  category: true,
  author: true,
  status: true,
  views: true,
  readingMinutes: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
};
export const mapBlogPost = (post) => ({
  ...post,
  ...mapMedia(post),
});

export async function getBlogSettings(client = prisma) {
  const { posts, ...settings } = await client.blogSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      description:
        'Catatan destinasi, inspirasi perjalanan, dan tips dari tim lokal.',
      enDescription:
        'Local insights, travel inspiration, and stories from the road.',
    },
    update: {},
    include: {
      posts: {
        orderBy: [{ sortOrder: 'asc' }, { postId: 'asc' }],
        select: { postId: true },
      },
    },
  });
  return { ...settings, selectedIds: posts.map((item) => item.postId) };
}

export async function saveBlogSettings(data, selectedIds) {
  await prisma.$transaction(async (tx) => {
    if (
      (await tx.blogPost.count({ where: { id: { in: selectedIds } } })) !==
      selectedIds.length
    )
      throw blogError(
        'Sebagian artikel sudah dihapus. Muat ulang pilihan artikel.',
      );
    await tx.blogSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    await tx.blogHomepageItem.deleteMany({ where: { settingsId: 1 } });
    if (selectedIds.length)
      await tx.blogHomepageItem.createMany({
        data: selectedIds.map((postId, sortOrder) => ({
          settingsId: 1,
          postId,
          sortOrder,
        })),
      });
  });
  return getBlogSettings();
}

export async function getHomepageBlog() {
  const settings = await getBlogSettings();
  const { selectedIds, ...publicSettings } = settings;
  let posts = [];
  if (!settings.visible) return { settings: publicSettings, posts };
  const where = publishedBlogWhere();
  if (settings.mode === 'MANUAL') {
    const selected = await prisma.blogHomepageItem.findMany({
      where: { settingsId: 1, post: { is: where } },
      orderBy: [{ sortOrder: 'asc' }, { postId: 'asc' }],
      take: settings.limit,
      include: { post: { select: blogSummary } },
    });
    posts = selected.map((item) => item.post);
  } else if (settings.mode === 'RANDOM') {
    const ids = (
      await prisma.blogPost.findMany({ where, select: { id: true } })
    ).map((post) => post.id);
    for (let index = ids.length - 1; index > 0; index--) {
      const target = crypto.randomInt(index + 1);
      [ids[index], ids[target]] = [ids[target], ids[index]];
    }
    const chosen = ids.slice(0, settings.limit);
    const found = await prisma.blogPost.findMany({
      where: { ...where, id: { in: chosen } },
      select: blogSummary,
    });
    posts = chosen
      .map((id) => found.find((post) => post.id === id))
      .filter(Boolean);
  } else {
    posts = await prisma.blogPost.findMany({
      where,
      select: blogSummary,
      take: settings.limit,
      orderBy:
        settings.mode === 'POPULAR'
          ? [{ views: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }]
          : [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
  }
  return { settings: publicSettings, posts: posts.map(mapBlogPost) };
}

export async function countBlogView(post, visitor) {
  const visitorHash = crypto.createHash('sha256').update(visitor).digest('hex');
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.blogView.create({ data: { postId: post.id, visitorHash, day } });
      const updated = await tx.blogPost.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      return updated.views;
    });
  } catch (error) {
    if (error.code === 'P2002')
      return (
        (
          await prisma.blogPost.findUnique({
            where: { id: post.id },
            select: { views: true },
          })
        )?.views ?? post.views
      );
    throw error;
  }
}
