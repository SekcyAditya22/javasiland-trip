const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
export function parseImageUpload(dataUrl) {
  if (typeof dataUrl !== 'string') fail('Format gambar tidak valid.');
  const match = dataUrl.match(
    /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/,
  );
  if (!match) fail('Gunakan file JPG, PNG, atau WebP yang valid.');
  if (match[2].length > Math.ceil((1024 * 1024) / 3) * 4)
    fail('Ukuran gambar maksimal 1 MB.', 413);
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 1024 * 1024)
    fail('Ukuran gambar maksimal 1 MB.', 413);
  if (
    buffer.toString('base64').replace(/=+$/, '') !== match[2].replace(/=+$/, '')
  )
    fail('Data gambar tidak valid.');
  const detected = buffer
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? 'png'
    : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
      ? 'jpg'
      : buffer.subarray(0, 4).toString() === 'RIFF' &&
          buffer.subarray(8, 12).toString() === 'WEBP'
        ? 'webp'
        : null;
  const ext = ['jpeg', 'jpg'].includes(match[1]) ? 'jpg' : match[1];
  if (detected !== ext) fail('Isi file tidak sesuai dengan format gambar.');
  return { buffer, ext };
}
