import { translate } from "../lib/i18n";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Hero from "../components/home/Hero";
import ServiceCards from "../components/home/ServiceCards";
import FaqSection from "../components/home/FaqSection";
import { imageUrl } from "../lib/images";
import BlogSection from "../components/home/BlogSection";
import HomepageContent from "../components/home/HomepageContent";
import HomeCatalogSection from "../components/home/HomeCatalogSection";

export default function HomePage({ catalog, lang }) {
  const t = (text) => translate(lang, text);
  return (
    <main>
      <Hero lang={lang} catalog={catalog} />
      <ServiceCards lang={lang} />
      <HomeCatalogSection kind="packages" catalog={catalog} lang={lang} />
      <HomeCatalogSection kind="fleet" catalog={catalog} lang={lang} />
      <section
        className="promo-band"
        id="promo"
        style={
          catalog.promos?.[0]?.image
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(51,78,172,.96), rgba(51,78,172,.78)), url(${imageUrl(catalog.promos[0].image, 1200)})`,
              }
            : undefined
        }
      >
        <div>
          <p className="section-kicker">{t("PROMO MUSIM INI")}</p>
          <h2>
            {(lang === "en"
              ? catalog.promos?.[0]?.enTitle || catalog.promos?.[0]?.title
              : catalog.promos?.[0]?.title) ||
              t("Perjalanan yang tinggal lebih lama.")}
          </h2>
          <p>
            {catalog.promos?.[0]
              ? `${catalog.promos[0].discount_type === "percent" ? catalog.promos[0].discount_value + "%" : catalog.promos[0].discount_value} ${lang === "en" ? "available on selected travel dates." : "khusus untuk tanggal perjalanan tertentu."}`
              : t("Booking tersimpan sebelum dikonfirmasi Owner.")}
          </p>
        </div>
        <Link className="button button-light" to="/packages">
          {t("Lihat paket")} <ArrowRight size={15} />
        </Link>
      </section>
      <HomepageContent catalog={catalog} lang={lang} />
      <BlogSection blog={catalog.blog} lang={lang} />
      {catalog.faqs.length > 0 && (
        <FaqSection faqs={catalog.faqs} lang={lang} />
      )}
    </main>
  );
}
