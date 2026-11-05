import useCarousel from "./useCarousel";
import {
  HOMEPAGE_CARD_LIMIT,
  homepageRotationItems,
} from "../lib/homepageCatalog";

export default function useHomepageRotation(catalog, kind) {
  const settings = catalog.homepageCatalog?.[kind];
  const pool = homepageRotationItems(catalog, kind);
  const enabled = Boolean(
    settings?.visible !== false &&
    settings?.rotateItems &&
    pool.length > HOMEPAGE_CARD_LIMIT,
  );
  const carousel = useCarousel({
    count: settings?.visible === false ? 0 : pool.length,
    sourceKey: JSON.stringify(pool.map((item) => item.id)),
    autoPlay: enabled,
    intervalSeconds: settings?.rotationIntervalSeconds ?? 10,
    step: HOMEPAGE_CARD_LIMIT,
  });
  const start = enabled ? carousel.index : 0;
  const items = Array.from(
    { length: Math.min(pool.length, HOMEPAGE_CARD_LIMIT) },
    (_, offset) => pool[(start + offset) % pool.length],
  );
  return { ...carousel, items, enabled, settings };
}
