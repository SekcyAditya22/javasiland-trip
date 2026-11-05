import { Router } from 'express';
import { createBooking, getCatalog } from '../data/store.js';

const router = Router();

router.get('/bootstrap', async (_req, res, next) => {
  try { res.json(await getCatalog()); } catch (error) { next(error); }
});

router.post('/quote', async (req, res, next) => {
  try {
    const catalog = await getCatalog();
    const { packageId, variantId, pax = 2, vehicleId, serviceType = 'driver_only' } = req.body ?? {};
    const packageItem = catalog.packages.find((item) => item.id === packageId);
    if (!packageItem) return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    const variant = packageItem.variantDetails?.find((item) => String(item.id) === String(variantId)) || packageItem.variantDetails?.[0];
    const tier = (variant?.priceTiers?.length ? variant.priceTiers : packageItem.priceTiers).find((item) => Number(item.pax) === Number(pax));
    const basePerPax = Number(tier?.price || variant?.price || packageItem.price || 0);
    const vehicleRate = catalog.rentalRates.find((item) => String(item.vehicleId) === String(vehicleId) && item.serviceType === serviceType);
    const baseAmount = basePerPax * Number(pax);
    const vehicleSurcharge = Number(vehicleRate?.price || 0);
    const totalAmount = baseAmount + vehicleSurcharge;
    res.json({ packageId, variantId: variant?.id ?? null, pax: Number(pax), basePerPax, baseAmount, vehicleSurcharge, totalAmount, currency: packageItem.area?.toLowerCase().includes('malaysia') ? 'MYR' : 'IDR' });
  } catch (error) { next(error); }
});

router.post('/inquiries', async (req, res, next) => {
  try {
    const booking = await createBooking(req.body ?? {});
    res.status(201).json({ booking, message: 'Permintaan booking tersimpan.' });
  } catch (error) { next(error); }
});

export default router;
