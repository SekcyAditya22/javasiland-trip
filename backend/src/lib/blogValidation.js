import { mediaData } from './media.js';

export const blogError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const text = (value, maximum, label) => {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > maximum)
    throw blogError(`${label} tidak valid atau terlalu panjang.`);
  return value.trim();
};
const summarize = (value) =>
  value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

export function blogPostData(body) {
  const title = text(body.title, 180, 'Judul');
  const slug = text(body.slug, 160, 'Slug').toLowerCase();
  const content = text(body.content, 200000, 'Isi artikel');
  const enContent = text(body.enContent, 200000, 'Isi English');
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || content.length < 10)
    throw blogError(
      'Judul, slug yang valid, dan isi artikel minimal 10 karakter wajib diisi.',
    );
  if (!['DRAFT', 'PUBLISHED'].includes(body.status))
    throw blogError('Status artikel tidak valid.');
  const image = text(body.image, 2048, 'Gambar');
  if (
    image &&
    !(
      /^https?:\/\/\S+$/i.test(image) ||
      /^\/uploads\/[a-z0-9._-]+$/i.test(image)
    )
  )
    throw blogError('URL gambar tidak valid.');
  const publishedAt = body.publishedAt
    ? new Date(body.publishedAt)
    : body.status === 'PUBLISHED'
      ? new Date()
      : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime()))
    throw blogError('Tanggal publikasi tidak valid.');
  return {
    title,
    slug,
    content,
    enContent,
    image,
    ...mediaData(body),
    status: body.status,
    publishedAt,
    enTitle: text(body.enTitle, 180, 'Judul English'),
    excerpt: text(body.excerpt, 500, 'Ringkasan') || summarize(content),
    enExcerpt:
      text(body.enExcerpt, 500, 'Ringkasan English') || summarize(enContent),
    category: text(body.category, 60, 'Kategori') || 'Inspirasi',
    author: text(body.author, 100, 'Penulis') || 'Java Island Trip',
    readingMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
  };
}

export function blogSettingsData(body) {
  if (!['LATEST', 'POPULAR', 'MANUAL', 'RANDOM'].includes(body.mode))
    throw blogError('Mode tampilan blog tidak valid.');
  if (typeof body.visible !== 'boolean')
    throw blogError('Status tampilan blog tidak valid.');
  const limit = Number(body.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 9)
    throw blogError('Jumlah artikel homepage harus 1–9.');
  if (
    !Array.isArray(body.selectedIds) ||
    body.selectedIds.length > 50 ||
    body.selectedIds.some((id) => !Number.isSafeInteger(id) || id < 1)
  )
    throw blogError('Pilihan artikel tidak valid.');
  const selectedIds = [...new Set(body.selectedIds)];
  return {
    data: {
      mode: body.mode,
      visible: body.visible,
      limit,
      title:
        text(body.title, 180, 'Judul bagian') || 'Cerita di setiap perjalanan.',
      enTitle: text(body.enTitle, 180, 'Judul bagian English'),
      description: text(body.description, 500, 'Deskripsi bagian'),
      enDescription: text(body.enDescription, 500, 'Deskripsi bagian English'),
    },
    selectedIds,
  };
}
