import { translate } from "../lib/i18n";
import { useSearchParams } from "react-router-dom";
import PackageCard from "../components/PackageCard";
import PageHero from "../components/PageHero";
import { isMalaysia } from "../lib/catalog";
import ScrollReveal from "../components/ScrollReveal";

export default function PackagesPage({ catalog, lang, malaysiaOnly = false }) {
  const t = (text) => translate(lang, text);
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "all";
  const setFilter = (value) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("filter");
    else next.set("filter", value);
    setParams(next, { replace: true, state: { preserveScroll: true } });
  };
  const list = catalog.packages
    .filter((item) => (malaysiaOnly ? isMalaysia(item) : !isMalaysia(item)))
    .filter(
      (item) =>
        filter === "all" || item.area === filter || item.theme === filter,
    );
  const localPackages = catalog.packages.filter((item) => !isMalaysia(item));
  const filters = malaysiaOnly
    ? []
    : [
        "all",
        ...new Set([
          ...localPackages.map((item) => item.area),
          ...localPackages.map((item) => item.theme),
        ]),
      ];
  return (
    <main>
      <PageHero
        kicker={
          malaysiaOnly
            ? "JAVA ISLAND TRIP · MALAYSIA 🇲🇾"
            : "JAVA ISLAND TRIP · IDR"
        }
        title={
          malaysiaOnly
            ? lang === "en"
              ? "Malaysia Hiking Trip"
              : "Trip Hiking Malaysia"
            : lang === "en"
              ? "All Trip Packages"
              : "Semua Paket Trip"
        }
        desc={
          malaysiaOnly
            ? t(
                "Pendakian gunung yang dikurasi untuk tamu Malaysia — harga dalam RM, minimal 4 peserta.",
              )
            : t(
                "Pilih pengalaman yang paling sesuai dengan caramu menjelajah Jawa.",
              )
        }
      />
      {malaysiaOnly && (
        <div className="section-top-badges">
          <span className="bubble-badge solid">RM ONLY</span>
          <span className="bubble-badge warn">MIN 4 PAX</span>
        </div>
      )}
      <ScrollReveal as="section" className="section catalog-section">
        {filters.length > 0 && (
          <div className="filter-row">
            {filters.map((item) => (
              <button
                key={item}
                className={
                  filter === item ? "filter-chip active" : "filter-chip"
                }
                onClick={() => setFilter(item)}
              >
                {item === "all" ? t("Semua") : item}
              </button>
            ))}
          </div>
        )}
        <div className="package-grid">
          {list.map((item, index) => (
            <PackageCard
              item={item}
              lang={lang}
              priority={index === 0}
              carouselSettings={catalog.homepageCatalog?.packages}
              key={item.id}
            />
          ))}
        </div>
      </ScrollReveal>
    </main>
  );
}
