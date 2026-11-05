import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(await fs.readFile(path.join(here, '../src/data/seed.json'), 'utf8'));
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'admin123';

const asArray = (value) => Array.isArray(value) ? value : [];

async function seedDatabase() {
  await prisma.adminSession.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.variantPriceTier.deleteMany();
  await prisma.packagePriceTier.deleteMany();
  await prisma.packageVariant.deleteMany();
  await prisma.package.deleteMany();
  await prisma.rentalRate.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.homepageSection.deleteMany();

  for (const item of seed.packages) {
    await prisma.package.create({
      data: {
        id: item.id,
        title: item.title,
        enTitle: item.enTitle || item.title,
        slug: item.id,
        area: item.area,
        duration: Number(item.duration || 1),
        theme: item.theme || 'culture',
        price: Number(item.price || 0),
        tag: item.tag || '',
        trail: item.trail || '',
        image: item.image || '',
        description: item.desc || '',
        enDescription: item.enDesc || item.desc || '',
        priceTiers: { create: asArray(item.priceTiers).map((tier) => ({ pax: Number(tier.pax), price: Number(tier.price), season: 'normal' })) },
        variants: { create: asArray(item.variantDetails).map((variant, index) => ({
          code: variant.code || String.fromCharCode(65 + index),
          title: variant.title || item.title,
          enTitle: variant.enTitle || variant.title || item.enTitle || item.title,
          subtitle: variant.subtitle || '',
          enSubtitle: variant.enSubtitle || variant.subtitle || '',
          heroImage: variant.heroImage || item.image || '',
          gallery: asArray(variant.gallery),
          itinerary: asArray(variant.itinerary),
          enItinerary: asArray(variant.enItinerary),
          includeItems: asArray(variant.include),
          enIncludeItems: asArray(variant.enInclude),
          excludeItems: asArray(variant.exclude),
          enExcludeItems: asArray(variant.enExclude),
          note: variant.note || '',
          enNote: variant.enNote || '',
          active: variant.active !== false,
          sortOrder: index,
          priceTiers: { create: asArray(variant.priceTiers).map((tier) => ({ pax: Number(tier.pax), price: Number(tier.price), season: 'normal' })) }
        })) }
      }
    });
  }

  for (const item of seed.fleet) {
    await prisma.vehicle.create({
      data: {
        id: Number(item.id),
        name: item.name,
        type: item.type || '',
        image: item.image || '',
        specs: asArray(item.specs),
        fromPrice: Number(item.from || 0),
        capacity: Number(item.capacity || 4),
        transmission: item.transmission || '',
        status: item.status || 'idle'
      }
    });
  }

  for (const item of seed.rentalRates) {
    await prisma.rentalRate.create({ data: { vehicleId: Number(item.vehicleId), serviceType: item.serviceType, durationHours: 12, price: Number(item.price || 0) } });
  }

  for (const item of seed.faqs) {
    await prisma.faq.create({ data: { id: Number(item.id), question: item.question, enQuestion: item.enQuestion || '', answer: item.answer || '', enAnswer: item.enAnswer || '', category: item.category || 'general', sortOrder: Number(item.sortOrder || 0), published: item.published !== false } });
  }

  for (const item of seed.homepage) {
    await prisma.homepageSection.create({ data: { sectionKey: item.sectionKey, title: item.title || '', enTitle: item.enTitle || '', body: item.body || '', enBody: item.enBody || '', image: item.image || '', sortOrder: Number(item.sortOrder || 0), visible: item.visible !== false } });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({ where: { username }, update: { passwordHash, active: true }, create: { username, passwordHash, role: 'OWNER' } });
  console.log(`Seed MySQL selesai. Admin: ${username}`);
}

seedDatabase().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
