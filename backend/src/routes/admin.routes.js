import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAdminCatalog, listBookings, updateBookingStatus } from '../data/store.js';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { resolvePublicAssetUrl } from '../lib/assets.js';
import { normalizeGallery } from '../lib/gallery.js';
import { syncPackageVariants } from '../data/packageVariants.js';
import { parseImageUpload } from '../lib/uploads.js';

const router = Router();
const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
router.use(requireAdmin);
router.use(['/packages', '/fleet'], (req, res, next) => {
  try {
    if (req.body?.gallery !== undefined) req.body.gallery = normalizeGallery(req.body.gallery);
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const listOrEmpty = (value) => Array.isArray(value) ? value : [];
const packageData = (body) => ({
  gallery: body.gallery,
  title: body.title || 'Paket baru', enTitle: body.enTitle || body.title || 'New package', slug: body.slug || body.id || `package-${Date.now()}`,
  area: body.area || 'Jogja', duration: Number(body.duration || 1), theme: body.theme || 'culture', price: Number(body.price || 0), tag: body.tag || '', trail: body.trail || '', image: body.image || '', description: body.desc || body.description || '', enDescription: body.enDesc || body.enDescription || body.desc || '', status: body.status || 'PUBLISHED'
});
const tierData = (tiers) => listOrEmpty(tiers).map((tier) => ({ pax: Number(tier.pax), price: Number(tier.price || tier.pricePerPax || 0), season: tier.season || 'normal' }));
const variantData = (variant, index) => ({ code: variant.code || String.fromCharCode(65 + index), title: variant.title || 'Varian', enTitle: variant.enTitle || variant.title || 'Variant', subtitle: variant.subtitle || '', enSubtitle: variant.enSubtitle || variant.subtitle || '', heroImage: variant.heroImage || '', gallery: listOrEmpty(variant.gallery), itinerary: listOrEmpty(variant.itinerary), enItinerary: listOrEmpty(variant.enItinerary), includeItems: listOrEmpty(variant.include), enIncludeItems: listOrEmpty(variant.enInclude), excludeItems: listOrEmpty(variant.exclude), enExcludeItems: listOrEmpty(variant.enExclude), note: variant.note || '', enNote: variant.enNote || '', active: variant.active !== false, sortOrder: index, priceTiers: { create: tierData(variant.priceTiers) } });

router.get('/dashboard', async (_req, res, next) => {
  try { const [catalog, bookings] = await Promise.all([getAdminCatalog(), listBookings()]); res.json({ stats: { packages: catalog.packages.filter((item) => item.status !== 'DRAFT').length, fleet: catalog.fleet.length, pending: bookings.filter((item) => item.status === 'WAITING_CONFIRMATION').length, totalBookings: bookings.length }, bookings, catalog }); } catch (error) { next(error); }
});

router.patch('/bookings/:id', async (req, res, next) => {
  try { const booking = await updateBookingStatus(req.params.id, req.body?.status || 'CONFIRMED'); if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' }); res.json(booking); } catch (error) { next(error); }
});

router.post('/uploads', async (req, res, next) => {
  try {
    const { dataUrl, filename = 'image' } = req.body ?? {};
    const { buffer, ext } = parseImageUpload(dataUrl);
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = String(filename).replace(/[^a-z0-9-_]/gi, '-').slice(0, 40) || 'image';
    const storedName = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${safeName}.${ext}`;
    await fs.writeFile(path.join(uploadsDir, storedName), buffer);
    res.status(201).json({ url: resolvePublicAssetUrl(`/uploads/${storedName}`), filename: storedName });
  } catch (error) { next(error); }
});

router.post('/packages', async (req, res, next) => {
  try { const body = req.body ?? {}; const data = packageData(body); const item = await prisma.package.create({ data: { ...data, id: body.id || data.slug, priceTiers: { create: tierData(body.priceTiers) }, variants: { create: listOrEmpty(body.variantDetails).map(variantData) } }, include: { priceTiers: true, variants: { include: { priceTiers: true } } } }); res.status(201).json(item); } catch (error) { next(error); }
});
router.put('/packages/:id', async (req, res, next) => {
  try {
    const data = packageData(req.body ?? {});
    const id = req.params.id;
    const item = await prisma.$transaction(async (tx) => {
      await syncPackageVariants(tx, id, listOrEmpty(req.body?.variantDetails), variantData);
      await tx.packagePriceTier.deleteMany({ where: { packageId: id } });
      return tx.package.update({ where: { id }, data: { ...data, slug: data.slug, priceTiers: { create: tierData(req.body?.priceTiers) } }, include: { priceTiers: true, variants: { include: { priceTiers: true } } } });
    });
    res.json(item);
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    next(error);
  }
});
router.delete('/packages/:id', async (req, res, next) => { try { await prisma.package.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (error) { next(error); } });

const vehicleData = (body) => ({ name: body.name || 'Unit baru', type: body.type || 'Vehicle', image: body.image || '', gallery: body.gallery, specs: listOrEmpty(body.specs), fromPrice: Number(body.from ?? body.fromPrice ?? 0), capacity: Number(body.capacity || 4), transmission: body.transmission || '', status: body.status || 'idle' });
router.post('/fleet', async (req, res, next) => { try { const body = req.body ?? {}; const item = await prisma.vehicle.create({ data: { ...vehicleData(body), rates: { create: listOrEmpty(body.rates).map((rate) => ({ serviceType: rate.serviceType, durationHours: Number(rate.durationHours || 12), price: Number(rate.price || 0) })) } } }); res.status(201).json(item); } catch (error) { next(error); } });
router.put('/fleet/:id', async (req, res, next) => { try { const id = Number(req.params.id); const item = await prisma.$transaction(async (tx) => { await tx.rentalRate.deleteMany({ where: { vehicleId: id } }); return tx.vehicle.update({ where: { id }, data: { ...vehicleData(req.body ?? {}), rates: { create: listOrEmpty(req.body?.rates).map((rate) => ({ serviceType: rate.serviceType, durationHours: Number(rate.durationHours || 12), price: Number(rate.price || 0) })) } } }); }); res.json(item); } catch (error) { next(error); } });
router.delete('/fleet/:id', async (req, res, next) => { try { await prisma.vehicle.delete({ where: { id: Number(req.params.id) } }); res.status(204).end(); } catch (error) { next(error); } });

router.post('/promos', async (req, res, next) => { try { const body = req.body ?? {}; const item = await prisma.promotion.create({ data: { title: body.title || 'Promo baru', enTitle: body.enTitle || body.title || '', discountType: body.discountType || 'percent', discountValue: Number(body.discountValue || 0), startsOn: body.startsOn || null, endsOn: body.endsOn || null, packageId: body.packageId || null, image: body.image || '', active: body.active !== false } }); res.status(201).json(item); } catch (error) { next(error); } });
router.put('/promos/:id', async (req, res, next) => { try { const body = req.body ?? {}; const item = await prisma.promotion.update({ where: { id: Number(req.params.id) }, data: { title: body.title, enTitle: body.enTitle || '', discountType: body.discountType || 'percent', discountValue: Number(body.discountValue || 0), startsOn: body.startsOn || null, endsOn: body.endsOn || null, packageId: body.packageId || null, image: body.image || '', active: body.active !== false } }); res.json(item); } catch (error) { next(error); } });
router.delete('/promos/:id', async (req, res, next) => { try { await prisma.promotion.delete({ where: { id: Number(req.params.id) } }); res.status(204).end(); } catch (error) { next(error); } });

router.post('/faqs', async (req, res, next) => { try { const body = req.body ?? {}; const item = await prisma.faq.create({ data: { question: body.question || '', enQuestion: body.enQuestion || '', answer: body.answer || '', enAnswer: body.enAnswer || '', category: body.category || 'general', sortOrder: Number(body.sortOrder || 0), published: body.published !== false } }); res.status(201).json(item); } catch (error) { next(error); } });
router.put('/faqs/:id', async (req, res, next) => { try { const body = req.body ?? {}; const item = await prisma.faq.update({ where: { id: Number(req.params.id) }, data: { question: body.question, enQuestion: body.enQuestion || '', answer: body.answer, enAnswer: body.enAnswer || '', category: body.category || 'general', sortOrder: Number(body.sortOrder || 0), published: body.published !== false } }); res.json(item); } catch (error) { next(error); } });
router.delete('/faqs/:id', async (req, res, next) => { try { await prisma.faq.delete({ where: { id: Number(req.params.id) } }); res.status(204).end(); } catch (error) { next(error); } });


export default router;
