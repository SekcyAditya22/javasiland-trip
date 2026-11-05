import { randomInt } from "node:crypto";
import { prisma } from "../lib/prisma.js";

export const HOMEPAGE_CARD_LIMIT = 3;
export const HOMEPAGE_POOL_LIMIT = 30;
const defaults = {
  packages: { title: "Mulai dari sini.", enTitle: "Start here." },
  fleet: { title: "Unit Armada", enTitle: "Our fleet" },
};
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });

export function assertCatalogKind(kind) {
  if (!Object.hasOwn(defaults, kind))
    throw fail("Jenis katalog tidak ditemukan.", 404);
}

export function eligibleHomepageItems(kind, items, includeDrafts = false) {
  return items.filter(
    (item) =>
      kind === "fleet" ||
      (!String(item.area || "")
        .toLowerCase()
        .includes("malaysia") &&
        (includeDrafts || item.status !== "DRAFT")),
  );
}

function mapSettings(kind, row) {
  return {
    kind,
    mode: row?.mode || "AUTO",
    visible: row?.visible ?? true,
    title: row?.title ?? defaults[kind].title,
    enTitle: row?.enTitle ?? defaults[kind].enTitle,
    imageAutoPlay: row?.imageAutoPlay ?? true,
    imageIntervalSeconds: row?.imageIntervalSeconds ?? 5,
    rotateItems: row?.rotateItems ?? false,
    rotationIntervalSeconds: row?.rotationIntervalSeconds ?? 10,
    selectedIds: Array.isArray(row?.selectedIds)
      ? row.selectedIds.map(String)
      : [],
  };
}

export function selectHomepagePool(settings, items) {
  const eligible = eligibleHomepageItems(settings.kind, items);
  if (settings.mode === "MANUAL") {
    const available = new Set(eligible.map((item) => String(item.id)));
    return settings.selectedIds
      .filter((id) => available.has(id))
      .slice(0, HOMEPAGE_POOL_LIMIT);
  }
  const ids = eligible.map((item) => String(item.id));
  if (settings.mode === "RANDOM") {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }
  return ids;
}

export function selectHomepageIds(settings, items) {
  return selectHomepagePool(settings, items).slice(0, HOMEPAGE_CARD_LIMIT);
}

export async function getCatalogHomepage(packages, fleet) {
  const rows = await prisma.catalogHomepageSettings.findMany();
  return Object.fromEntries(
    Object.keys(defaults).map((kind) => {
      const settings = mapSettings(
        kind,
        rows.find((row) => row.kind === kind),
      );
      const pool = selectHomepagePool(
        settings,
        kind === "packages" ? packages : fleet,
      );
      return [
        kind,
        {
          ...settings,
          selectedIds: pool.slice(0, HOMEPAGE_CARD_LIMIT),
          rotationIds: pool,
        },
      ];
    }),
  );
}

async function availableItems(kind, ids) {
  return kind === "packages"
    ? prisma.package.findMany({
        where: { id: { in: ids } },
        select: { id: true, area: true, status: true },
      })
    : prisma.vehicle.findMany({
        where: { id: { in: ids.map(Number) } },
        select: { id: true },
      });
}

export async function getCatalogHomepageSettings(kind) {
  assertCatalogKind(kind);
  const settings = mapSettings(
    kind,
    await prisma.catalogHomepageSettings.findUnique({ where: { kind } }),
  );
  const items = await availableItems(kind, settings.selectedIds);
  const available = new Set(
    eligibleHomepageItems(kind, items, true).map((item) => String(item.id)),
  );
  // Deleted records disappear from the editor; drafts remain selected for publishing later.
  return {
    ...settings,
    selectedIds: settings.selectedIds.filter((id) => available.has(id)),
  };
}

export async function saveCatalogHomepageSettings(kind, body) {
  assertCatalogKind(kind);
  if (!body || !["AUTO", "MANUAL", "RANDOM"].includes(body.mode))
    throw fail("Pilih mode otomatis, pilihan admin, atau acak.");
  if (typeof body.visible !== "boolean")
    throw fail("Pengaturan tampil di homepage tidak valid.");
  const text = {};
  for (const field of ["title", "enTitle"]) {
    if (typeof body[field] !== "string" || body[field].trim().length > 180)
      throw fail("Judul bagian maksimal 180 karakter.");
    text[field] = body[field].trim();
  }
  if (!text.title) throw fail("Judul bagian wajib diisi.");
  if (
    !Array.isArray(body.selectedIds) ||
    body.selectedIds.length > HOMEPAGE_POOL_LIMIT
  )
    throw fail("Pilih maksimal 30 kartu untuk daftar pilihan homepage.");
  const ids = body.selectedIds.map((id) => {
    if (
      (typeof id !== "string" && typeof id !== "number") ||
      !String(id).length ||
      String(id).length > 191
    )
      throw fail("Pilihan kartu tidak valid.");
    const value = String(id);
    if (
      kind === "fleet" &&
      (!/^[1-9]\d*$/.test(value) ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) > 2147483647)
    )
      throw fail("Pilihan armada tidak valid.");
    return value;
  });
  if (new Set(ids).size !== ids.length)
    throw fail("Kartu yang sama tidak boleh dipilih dua kali.");
  const available = eligibleHomepageItems(
    kind,
    await availableItems(kind, ids),
    true,
  );
  const availableIds = new Set(available.map((item) => String(item.id)));
  if (ids.some((id) => !availableIds.has(id)))
    throw fail(
      "Ada pilihan yang sudah dihapus atau bukan paket lokal. Muat ulang pilihan Anda.",
    );
  const previous = mapSettings(
    kind,
    await prisma.catalogHomepageSettings.findUnique({ where: { kind } }),
  );
  const playback = {};
  for (const field of ["imageAutoPlay", "rotateItems"]) {
    const value = body[field] === undefined ? previous[field] : body[field];
    if (typeof value !== "boolean") throw fail("Mode carousel tidak valid.");
    playback[field] = value;
  }
  for (const [field, min, max] of [
    ["imageIntervalSeconds", 2, 60],
    ["rotationIntervalSeconds", 5, 120],
  ]) {
    const value = body[field] === undefined ? previous[field] : body[field];
    if (!Number.isInteger(value) || value < min || value > max)
      throw fail(
        `Jeda ${field === "imageIntervalSeconds" ? "gambar" : "kartu homepage"} harus ${min}–${max} detik.`,
      );
    playback[field] = value;
  }
  const data = {
    mode: body.mode,
    visible: body.visible,
    ...text,
    selectedIds: ids,
    ...playback,
  };
  const row = await prisma.catalogHomepageSettings.upsert({
    where: { kind },
    update: data,
    create: { kind, ...data },
  });
  return mapSettings(kind, row);
}
