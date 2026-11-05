import { prisma } from '../lib/prisma.js';
import { resolvePublicAssetUrl } from '../lib/assets.js';
import { getHomepageBlog } from './blog.js';
import { mapMedia } from '../lib/media.js';
import { getCatalogHomepage } from './catalogHomepage.js';

const mapVariant = (variant) => ({
  id: variant.id,
  code: variant.code,
  title: variant.title,
  enTitle: variant.enTitle,
  subtitle: variant.subtitle,
  enSubtitle: variant.enSubtitle,
  heroImage: resolvePublicAssetUrl(variant.heroImage),
  gallery: (variant.gallery || []).map(resolvePublicAssetUrl),
  itinerary: variant.itinerary || [],
  enItinerary: variant.enItinerary || [],
  include: variant.includeItems || [],
  enInclude: variant.enIncludeItems || [],
  exclude: variant.excludeItems || [],
  enExclude: variant.enExcludeItems || [],
  note: variant.note,
  enNote: variant.enNote,
  active: variant.active,
  priceTiers: variant.priceTiers.map((tier) => ({ pax: tier.pax, price: tier.price, season: tier.season }))
});

const mapPackage = (item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  enTitle: item.enTitle,
  area: item.area,
  duration: item.duration,
  theme: item.theme,
  price: item.price,
  tag: item.tag,
  trail: item.trail,
  image: resolvePublicAssetUrl(item.image),
  gallery: (item.gallery || []).map(resolvePublicAssetUrl),
  desc: item.description,
  enDesc: item.enDescription,
  status: item.status,
  priceTiers: item.priceTiers.map((tier) => ({ pax: tier.pax, price: tier.price, season: tier.season })),
  variantDetails: item.variants.map(mapVariant)
});

const mapPromotion = (item) => ({
  id: item.id,
  title: item.title,
  enTitle: item.enTitle,
  en_title: item.enTitle,
  discountType: item.discountType,
  discount_type: item.discountType,
  discountValue: item.discountValue,
  discount_value: item.discountValue,
  startsOn: item.startsOn,
  starts_on: item.startsOn,
  endsOn: item.endsOn,
  ends_on: item.endsOn,
  packageId: item.packageId,
  package_id: item.packageId,
  image: resolvePublicAssetUrl(item.image),
  active: item.active
});

const mapFaq = (item) => ({
  id: item.id,
  question: item.question,
  enQuestion: item.enQuestion,
  answer: item.answer,
  enAnswer: item.enAnswer,
  category: item.category,
  sortOrder: item.sortOrder,
  published: item.published
});

const mapHomepageSection = (item) => ({
  sectionKey: item.sectionKey,
  title: item.title,
  enTitle: item.enTitle,
  body: item.body,
  enBody: item.enBody,
  ...mapMedia(item),
  sortOrder: item.sortOrder,
  visible: item.visible
});

async function loadCatalog({ includeUnpublished = false } = {}) {
  const packageWhere = includeUnpublished
    ? undefined
    : { status: { not: 'DRAFT' } };
  const variantWhere = includeUnpublished ? undefined : { active: true };
  const promoWhere = includeUnpublished ? undefined : { active: true };
  const faqWhere = includeUnpublished ? undefined : { published: true };

  const [packages, fleet, rentalRates, promos, faqs, homepage, blog] = await Promise.all([
    prisma.package.findMany({ where: packageWhere, include: { priceTiers: true, variants: { where: variantWhere, orderBy: { sortOrder: 'asc' }, include: { priceTiers: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.vehicle.findMany({ orderBy: { id: 'asc' } }),
    prisma.rentalRate.findMany({ orderBy: { vehicleId: 'asc' } }),
    prisma.promotion.findMany({ where: promoWhere, orderBy: { id: 'asc' } }),
    prisma.faq.findMany({ where: faqWhere, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.homepageSection.findMany({ orderBy: [{ sortOrder: 'asc' }, { sectionKey: 'asc' }] }),
    getHomepageBlog(),
  ]);
  return {
    blog,
    homepageCatalog: await getCatalogHomepage(packages, fleet),
    packages: packages.map(mapPackage),
    fleet: fleet.map((item) => ({ id: item.id, name: item.name, type: item.type, image: resolvePublicAssetUrl(item.image), gallery: (item.gallery || []).map(resolvePublicAssetUrl), specs: item.specs || [], from: item.fromPrice, capacity: item.capacity, transmission: item.transmission, status: item.status, rates: rentalRates.filter((rate) => rate.vehicleId === item.id).map((rate) => ({ serviceType: rate.serviceType, durationHours: rate.durationHours, price: rate.price })) })),
    rentalRates: rentalRates.map((item) => ({ vehicleId: item.vehicleId, serviceType: item.serviceType, price: item.price, durationHours: item.durationHours })),
    promos: promos.map(mapPromotion),
    faqs: faqs.map(mapFaq),
    homepage: homepage.filter((item) => includeUnpublished || item.visible).map(mapHomepageSection),
    homepageVisibility: Object.fromEntries(homepage.map((item) => [item.sectionKey, item.visible]))
  };
}

export function getCatalog() {
  return loadCatalog();
}

export function getAdminCatalog() {
  return loadCatalog({ includeUnpublished: true });
}

const mapBooking = (booking) => ({
  id: booking.id,
  packageId: booking.packageId,
  variantId: booking.variantId,
  vehicleId: booking.vehicleId,
  packageTitle: booking.packageTitle,
  variantTitle: booking.variantTitle,
  name: booking.name,
  phone: booking.phone,
  email: booking.email,
  serviceType: booking.serviceType,
  date: booking.date,
  pax: booking.pax,
  pickup: booking.pickup,
  notes: booking.notes,
  locale: booking.locale,
  audience: booking.audience,
  status: booking.status,
  totalAmount: booking.totalAmount,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

export async function createBooking(payload) {
  const id = `JIT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const booking = await prisma.booking.create({ data: {
    id,
    packageId: payload.packageId || null,
    variantId: payload.variantId ? Number(payload.variantId) : null,
    vehicleId: payload.vehicleId ? Number(payload.vehicleId) : null,
    packageTitle: payload.packageTitle || '',
    variantTitle: payload.variantTitle || '',
    name: payload.name || '',
    phone: payload.phone || '',
    email: payload.email || null,
    serviceType: payload.serviceType || 'driver_only',
    date: payload.date || payload.travelDate || '',
    pax: Number(payload.pax || 2),
    pickup: payload.pickup || '',
    notes: payload.notes || '',
    locale: payload.locale || 'id',
    audience: payload.audience || 'local',
    status: 'WAITING_CONFIRMATION',
    totalAmount: Number(payload.totalAmount || 0)
  } });
  return mapBooking(booking);
}

export async function listBookings() {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
  return bookings.map(mapBooking);
}

export async function updateBookingStatus(id, status) {
  try {
    return mapBooking(await prisma.booking.update({ where: { id }, data: { status } }));
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}
