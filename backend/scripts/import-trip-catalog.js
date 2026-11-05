import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { parseTripText } from "../src/services/tripTextParser.js";

const prisma = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));
const tripFile = path.resolve(here, "../../trip/trip.txt");

const englishIncluded = [
  "Private car",
  "Driver as guide",
  "Fuel",
  "Parking",
  "Attraction entrance tickets",
  "Jeep or VW according to the selected package",
  "Complimentary mineral water during the trip",
];
const englishExcluded = [
  "Personal expenses",
  "Hotel",
  "Train or flight tickets",
];

const packageDefinitions = (parsed) => [
  {
    id: "jogja-one-day-tour",
    title: "Paket 1 Day Tour Jogja",
    enTitle: "Jogja One Day Tour",
    area: "Jogja",
    duration: 1,
    theme: "culture",
    tag: "8 Pilihan Rute",
    trail: "Jogja & sekitarnya",
    image:
      "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=85",
    description:
      "Delapan pilihan rute wisata Jogja dalam satu hari, dari Mangunan, pantai selatan, wisata budaya, hingga kawasan Borobudur.",
    enDescription:
      "Eight one-day Jogja routes covering Mangunan, the south coast, heritage sites, and the Borobudur area.",
    variants: parsed.jogjaVariants,
  },
  {
    id: "magelang-sunrise-tour",
    title: "Paket Sunrise Magelang",
    enTitle: "Magelang Sunrise Tour",
    area: "Magelang",
    duration: 1,
    theme: "nature",
    tag: "Sunrise Trip",
    trail: "Nepal van Java",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    description:
      "Perjalanan sunrise ke Nepal van Java dan Negeri Sayur Sukomakmur, dilanjutkan VW Tour Borobudur.",
    enDescription:
      "A sunrise journey to Nepal van Java and Sukomakmur, followed by a Borobudur VW tour.",
    variants: parsed.magelang ? [parsed.magelang] : [],
  },
  {
    id: "dieng-midnight-sunrise",
    title: "Paket Sunrise Dieng Midnight",
    enTitle: "Dieng Midnight Sunrise Tour",
    area: "Dieng",
    duration: 1,
    theme: "nature",
    tag: "Midnight Trip",
    trail: "Sikunir / Taman Langit",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=85",
    description:
      "Berangkat tengah malam untuk menikmati sunrise Dieng, Kawah Sikidang, Candi Arjuna, dan Telaga Menjer.",
    enDescription:
      "A midnight departure for Dieng sunrise, Sikidang Crater, Arjuna Temple, and Menjer Lake.",
    variants: parsed.dieng ? [parsed.dieng] : [],
  },
  {
    id: "custom-trip",
    title: "Custom Trip",
    enTitle: "Custom Trip",
    area: "Jawa",
    duration: 1,
    theme: "custom",
    tag: "Sesuai Request",
    trail: "Fleksibel",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=85",
    description:
      "Rute, durasi, dan kebutuhan perjalanan disusun mengikuti permintaan customer. Harga menyesuaikan detail perjalanan.",
    enDescription:
      "Route, duration, and travel requirements are tailored to the customer. Pricing follows the final itinerary.",
    variants: [parsed.custom],
  },
];

const priceAtFourPax = (variant) =>
  variant.priceTiers.find((tier) => tier.pax === 4)?.price ||
  variant.priceTiers[0]?.price ||
  0;

async function upsertPackage(definition, facilities) {
  const firstVariant = definition.variants[0] || {
    priceTiers: [],
    itinerary: [],
  };
  const packageData = {
    title: definition.title,
    enTitle: definition.enTitle,
    slug: definition.id,
    area: definition.area,
    duration: definition.duration,
    theme: definition.theme,
    price: priceAtFourPax(firstVariant),
    tag: definition.tag,
    trail: definition.trail,
    image: definition.image,
    description: definition.description,
    enDescription: definition.enDescription,
    status: "PUBLISHED",
  };

  await prisma.$transaction(async (tx) => {
    await tx.package.upsert({
      where: { id: definition.id },
      update: packageData,
      create: { id: definition.id, ...packageData },
    });
    await tx.packagePriceTier.deleteMany({
      where: { packageId: definition.id },
    });
    if (firstVariant.priceTiers.length) {
      await tx.packagePriceTier.createMany({
        data: firstVariant.priceTiers.map((tier) => ({
          packageId: definition.id,
          pax: tier.pax,
          price: tier.price,
          season: "normal",
        })),
      });
    }

    for (const [index, variant] of definition.variants.entries()) {
      const variantData = {
        title: variant.title,
        enTitle: variant.title,
        subtitle: definition.trail,
        enSubtitle: definition.trail,
        heroImage: definition.image,
        gallery: [],
        itinerary: variant.itinerary,
        enItinerary: variant.itinerary,
        includeItems: facilities.include,
        enIncludeItems: englishIncluded,
        excludeItems: facilities.exclude,
        enExcludeItems: englishExcluded,
        note:
          definition.id === "custom-trip"
            ? "Harga akan menyesuaikan request customer."
            : "Jeep atau VW mengikuti fasilitas pada paket yang dipilih.",
        enNote:
          definition.id === "custom-trip"
            ? "Pricing follows the customer's requested itinerary."
            : "Jeep or VW service follows the selected package.",
        active: true,
        sortOrder: index,
      };
      const storedVariant = await tx.packageVariant.upsert({
        where: {
          packageId_code: { packageId: definition.id, code: variant.code },
        },
        update: variantData,
        create: {
          packageId: definition.id,
          code: variant.code,
          ...variantData,
        },
      });
      await tx.variantPriceTier.deleteMany({
        where: { variantId: storedVariant.id },
      });
      if (variant.priceTiers.length) {
        await tx.variantPriceTier.createMany({
          data: variant.priceTiers.map((tier) => ({
            variantId: storedVariant.id,
            pax: tier.pax,
            price: tier.price,
            season: "normal",
          })),
        });
      }
    }
  });
}

async function importTripCatalog() {
  const source = await fs.readFile(tripFile, "utf8");
  if (!source.trim()) {
    throw new Error(`File sumber kosong: ${tripFile}`);
  }
  const parsed = parseTripText(source);
  if (parsed.jogjaVariants.length !== 8) {
    throw new Error(
      `Paket Jogja A-H tidak lengkap. Ditemukan ${parsed.jogjaVariants.length} varian.`,
    );
  }
  for (const definition of packageDefinitions(parsed)) {
    await upsertPackage(definition, parsed.facilities);
  }
  console.log(
    `Import trip.txt selesai: ${parsed.jogjaVariants.length} varian Jogja dan 3 paket tambahan.`,
  );
}

importTripCatalog()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
