import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';

test('unknown endpoints return 404 and uploaded assets support browser caching', async () => {
  const uploads = fileURLToPath(new URL('../uploads/', import.meta.url));
  const filename = `cache-test-${randomUUID()}.png`;
  const target = path.join(uploads, filename);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const missingApi = await fetch(`${base}/api/not-a-real-endpoint`);
    assert.equal(missingApi.status, 404);
    assert.match(missingApi.headers.get('content-type'), /application\/json/);
    assert.equal((await fetch(`${base}/uploads/not-a-real-image.png`)).status, 404);
    await fs.mkdir(uploads, { recursive: true });
    await fs.writeFile(target, 'cache test fixture');
    const asset = await fetch(`${base}/uploads/${filename}`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('cache-control'), /max-age=604800/);
    assert.match(asset.headers.get('cache-control'), /immutable/);
    assert.ok(asset.headers.get('etag'));
    const cached = await fetch(`${base}/uploads/${filename}`, { headers: { 'If-None-Match': asset.headers.get('etag'), 'Cache-Control': 'max-age=0' } });
    assert.equal(cached.status, 304);
  } finally {
    await fs.unlink(target).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
});
