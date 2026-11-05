import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import usersRoutes from './routes/users.routes.js';
import { adminBlogRoutes, publicBlogRoutes } from './routes/blog.routes.js';
import homepageRoutes from './routes/homepage.routes.js';
import catalogHomepageRoutes from './routes/catalogHomepage.routes.js';
import {
  securityHeaders,
  protectApi,
  corsOptions,
  apiLimiter,
} from './middleware/security.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');
app.use(securityHeaders);
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()',
  );
  next();
});
app.use('/api', protectApi, cors(corsOptions), apiLimiter);
app.use(express.json({ limit: '2mb', inflate: false }));
app.use(cookieParser());
app.use(
  '/uploads',
  express.static(path.resolve(here, '../uploads'), {
    maxAge: '7d',
    immutable: true,
  }),
);
app.use('/uploads', (_req, res) => res.status(404).end());

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'java-island-trip-api' }),
);
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/public/blog', publicBlogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/blog', adminBlogRoutes);
app.use('/api/admin/homepage', homepageRoutes);
app.use('/api/admin/catalog-homepage', catalogHomepageRoutes);
app.use('/api', (_req, res) =>
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' }),
);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(here, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) =>
    res.sendFile(path.join(frontendDist, 'index.html')),
  );
}

app.use((error, req, res, _next) => {
  if (error.type === 'entity.too.large')
    return res.status(413).json({ message: 'Ukuran data terlalu besar.' });
  if (error.type === 'entity.parse.failed')
    return res.status(400).json({ message: 'Format JSON tidak valid.' });
  if (error.status && error.status < 500)
    return res
      .status(error.status)
      .json({ code: error.code, message: error.message });
  console.error(
    'API request failed:',
    req.method,
    req.path,
    error.code || error.name,
  );
  if (['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code))
    return res
      .status(503)
      .json({
        code: 'SERVICE_UNAVAILABLE',
        message:
          'Layanan sedang menyiapkan koneksi. Coba kembali sebentar lagi.',
      });
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

export default app;
