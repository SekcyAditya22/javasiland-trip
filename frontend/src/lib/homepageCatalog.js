import { isMalaysia } from "./catalog";

export const HOMEPAGE_CARD_LIMIT = 3;
export const HOMEPAGE_POOL_LIMIT = 30;
export const homepageCatalogItems = (kind, items, includeDrafts = false) =>
  items.filter(
    (item) =>
      kind === "fleet" ||
      (!isMalaysia(item) && (includeDrafts || item.status !== "DRAFT")),
  );

export function homepageRotationItems(catalog, kind) {
  const items = homepageCatalogItems(kind, catalog[kind] || []);
  const settings = catalog.homepageCatalog?.[kind];
  if (!settings) return items.slice(0, HOMEPAGE_CARD_LIMIT);
  const byId = new Map(items.map((item) => [String(item.id), item]));
  return (settings.rotationIds || settings.selectedIds)
    .map((id) => byId.get(String(id)))
    .filter(Boolean);
}

export function selectedHomepageItems(catalog, kind) {
  return homepageRotationItems(catalog, kind).slice(0, HOMEPAGE_CARD_LIMIT);
}
