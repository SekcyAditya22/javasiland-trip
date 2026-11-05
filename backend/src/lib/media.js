import { normalizeGallery as normalizeUrls } from './gallery.js';
import { resolvePublicAssetUrl } from './assets.js';
import { Prisma } from '@prisma/client';

const invalid = (message) => Object.assign(new Error(message), { status: 400 });
const normalizeGallery = (value) => {
  try {
    return normalizeUrls(value);
  } catch (error) {
    throw invalid(error.message);
  }
};
const ratios = ['16/9', '3/2', '4/3', '1/1', '4/5'];

export function mediaData(body) {
  const data = {};
  if (body.imageSettings === null) data.imageSettings = Prisma.DbNull;
  if (body.image !== undefined) {
    if (typeof body.image !== 'string')
      throw invalid('Gambar sampul tidak valid.');
    data.image = body.image.trim() ? normalizeGallery([body.image])[0] : '';
  }
  if (body.gallery !== undefined) {
    if (!Array.isArray(body.gallery) || body.gallery.length > 30)
      throw invalid('Galeri maksimal 30 gambar.');
    data.gallery = normalizeGallery(body.gallery);
  }
  if (body.imageSettings != null) {
    const value = body.imageSettings;
    if (
      !ratios.includes(value.ratio) ||
      !Array.isArray(value.items) ||
      value.items.length > 31
    )
      throw invalid('Pengaturan gambar tidak valid.');
    data.imageSettings = {
      ratio: value.ratio,
      items: value.items.map((item) => {
        if (
          !item ||
          !['cover', 'contain'].includes(item.fit) ||
          !Number.isFinite(item.x) ||
          !Number.isFinite(item.y) ||
          !Number.isFinite(item.zoom) ||
          item.x < 0 ||
          item.x > 100 ||
          item.y < 0 ||
          item.y > 100 ||
          item.zoom < 1 ||
          item.zoom > 2.5
        )
          throw invalid('Posisi atau ukuran gambar tidak valid.');
        return {
          src: normalizeGallery([item.src])[0],
          x: item.x,
          y: item.y,
          zoom: item.zoom,
          fit: item.fit,
        };
      }),
    };
  }
  return data;
}

export const mapMedia = (item) => ({
  image: resolvePublicAssetUrl(item.image),
  gallery: (item.gallery || []).map(resolvePublicAssetUrl),
  imageSettings: item.imageSettings
    ? {
        ...item.imageSettings,
        items: (item.imageSettings.items || []).map((entry) => ({
          ...entry,
          src: resolvePublicAssetUrl(entry.src),
        })),
      }
    : null,
});
