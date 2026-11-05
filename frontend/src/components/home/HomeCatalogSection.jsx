import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import PackageCard from "../PackageCard";
import VehicleCard from "../VehicleCard";
import ScrollReveal from "../ScrollReveal";
import CatalogSeeMoreCard from "./CatalogSeeMoreCard";
import {
  homepageCatalogItems,
  HOMEPAGE_CARD_LIMIT,
} from "../../lib/homepageCatalog";
import useHomepageRotation from "../../hooks/useHomepageRotation";

export default function HomeCatalogSection({ kind, catalog, lang }) {
  const fleet = kind === "fleet";
  const en = lang === "en";
  const settings = catalog.homepageCatalog?.[kind];
  const rotation = useHomepageRotation(catalog, kind);
  if (
    settings?.visible === false ||
    !homepageCatalogItems(kind, catalog[kind] || []).length
  )
    return null;
  const items = rotation.items;
  const fallbackTitle = fleet
    ? en
      ? "Our fleet"
      : "Unit Armada"
    : en
      ? "Start here."
      : "Mulai dari sini.";
  const title =
    (en ? settings?.enTitle || settings?.title : settings?.title) ||
    fallbackTitle;
  return (
    <ScrollReveal
      as="section"
      className={`section ${fleet ? "home-fleet-section" : "featured-section"}`}
      id={kind}
    >
      <div
        className="homepage-catalog-carousel"
        data-rotating={rotation.enabled}
        ref={rotation.ref}
        {...rotation.interactionProps}
      >
        <div className="section-head">
          <div>
            <p className="section-kicker">
              {fleet
                ? en
                  ? "TRAVEL AT YOUR OWN PACE"
                  : "NYAMAN DI SETIAP PERJALANAN"
                : en
                  ? "MADE FOR YOUR JOURNEY"
                  : "PILIHAN UNTUK PERJALANANMU"}
            </p>
            <h2>{title}</h2>
          </div>
          <div className="homepage-catalog-actions">
            <Link className="link-arrow" to={fleet ? "/rental" : "/packages"}>
              {fleet
                ? en
                  ? "View all vehicles"
                  : "Lihat semua armada"
                : en
                  ? "View all packages"
                  : "Lihat semua paket"}
              <ArrowRight size={15} />
            </Link>
            {rotation.enabled && (
              <div
                className="catalog-switcher"
                role="group"
                aria-label={
                  en ? "More homepage choices" : "Pilihan homepage lainnya"
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    rotation.select(rotation.index - HOMEPAGE_CARD_LIMIT)
                  }
                  aria-label={
                    fleet
                      ? en
                        ? "Previous vehicles"
                        : "Armada sebelumnya"
                      : en
                        ? "Previous trips"
                        : "Paket sebelumnya"
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    rotation.select(rotation.index + HOMEPAGE_CARD_LIMIT)
                  }
                  aria-label={
                    fleet
                      ? en
                        ? "Next vehicles"
                        : "Armada berikutnya"
                      : en
                        ? "Next trips"
                        : "Paket berikutnya"
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className={`${fleet ? "fleet-grid" : "package-grid"} homepage-catalog-grid`}
        >
          {items.map((item) =>
            fleet ? (
              <VehicleCard
                vehicle={item}
                lang={lang}
                key={item.id}
                carouselSettings={settings}
              />
            ) : (
              <PackageCard
                item={item}
                lang={lang}
                key={item.id}
                carouselSettings={settings}
              />
            ),
          )}
          <CatalogSeeMoreCard kind={kind} lang={lang} />
        </div>
      </div>
    </ScrollReveal>
  );
}
