export function normalizeGallery(value) {
  if (!Array.isArray(value)) throw new Error('Galeri harus berupa daftar gambar.');
  const images = value.map((url) => {
    if (typeof url !== 'string') throw new Error('URL gambar galeri tidak valid.');
    const image = url.trim();
    if (image.length > 2048 || !(/^https?:\/\/\S+$/i.test(image) || /^\/uploads\/[a-z0-9._-]+$/i.test(image))) throw new Error('Gunakan URL gambar HTTP/HTTPS atau file upload yang valid.');
    return image;
  });
  return [...new Set(images)];
}
