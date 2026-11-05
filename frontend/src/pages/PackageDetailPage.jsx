import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MapPin,
  Mountain,
  UsersRound,
  XCircle,
} from "lucide-react";
import { translate, localizedList } from "../lib/i18n";
import { PHONE, descOf, money, priceFor, titleOf } from "../lib/catalog";
import ImageCarousel from "../components/ImageCarousel";
import { imageList } from "../lib/images";
import NotFoundPage from "./NotFoundPage";
import ScrollReveal from "../components/ScrollReveal";
import BackLink from "../components/BackLink";

const fallbackItinerary = [
  "Penjemputan dan perjalanan menuju destinasi",
  "Eksplorasi utama bersama tim lokal",
  "Kembali dengan pengalaman dan cerita baru",
];
const fallbackInclude = ["Kendaraan private dan driver", "Air mineral"];
const fallbackExclude = ["Pengeluaran pribadi", "Kebutuhan di luar paket"];

const createFallbackVariant = (item) => ({
  id: "default",
  code: "A",
  title: item?.title || "Paket utama",
  enTitle: item?.enTitle || item?.title || "Main package",
  subtitle: item?.trail || "",
  enSubtitle: item?.trail || "",
  heroImage: item?.image || "",
  gallery: [],
  itinerary: [],
  enItinerary: [],
  include: [],
  enInclude: [],
  exclude: [],
  enExclude: [],
  note: "",
  enNote: "",
  priceTiers: item?.priceTiers || [],
});

export default function PackageDetailPage({ catalog, lang, malaysia = false }) {
  const t = (text) => translate(lang, text);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const item = catalog.packages.find(
    (entry) => entry.id === id || entry.slug === id,
  );
  const variants = useMemo(() => {
    if (!item) return [];
    return item.variantDetails?.length
      ? item.variantDetails
      : [createFallbackVariant(item)];
  }, [item]);
  const [selectedVariantId, setSelectedVariantId] = useState(() =>
    searchParams.get("variant"),
  );
  const [pax, setPax] = useState(malaysia ? 4 : 2);
  const variant =
    variants.find((entry) => String(entry.id) === String(selectedVariantId)) ||
    variants[0];
  const images = useMemo(
    () =>
      imageList(
        variant?.heroImage,
        item?.image,
        item?.gallery,
        variant?.gallery,
      ),
    [item?.image, item?.gallery, variant],
  );

  if (!item || !variant) {
    return <NotFoundPage lang={lang} />;
  }

  const priceTiers = variant.priceTiers?.length
    ? variant.priceTiers
    : item.priceTiers || [];
  const paxOptions = priceTiers.length
    ? [...new Set(priceTiers.map((tier) => Number(tier.pax)))].sort(
        (first, second) => first - second,
      )
    : malaysia
      ? [4, 5, 6, 7, 8, 9, 10]
      : [2, 3, 4, 5, 6, 7, 8, 9];
  const selectedPax = paxOptions.includes(pax) ? pax : paxOptions[0];
  const perPax = priceFor(variant, selectedPax) || priceFor(item, selectedPax);
  const hasPrice = perPax > 0;
  const total = perPax * selectedPax;
  const itinerary = localizedList(
    variant,
    "itinerary",
    lang,
    fallbackItinerary,
  );
  const included = localizedList(variant, "include", lang, fallbackInclude);
  const excluded = localizedList(variant, "exclude", lang, fallbackExclude);
  const note = lang === "en" ? variant.enNote || variant.note : variant.note;
  const variantTitle =
    lang === "en" ? variant.enTitle || variant.title : variant.title;
  const whatsapp = `https://wa.me/${PHONE}?text=${encodeURIComponent(`${lang === "en" ? "Hello JAVA ISLAND TRIP, I would like to enquire about" : "Halo JAVA ISLAND TRIP, saya ingin bertanya tentang"} ${titleOf(item, lang)} - ${variantTitle}.`)}`;

  return (
    <main>
      <section className="detail-page">
        <BackLink
          className="back-link"
          to={malaysia ? "/malaysia" : "/packages"}
        >
          <ChevronLeft size={16} /> {t("Kembali ke daftar paket")}
        </BackLink>
        <div className="detail-layout">
          <div className="detail-gallery">
            <ImageCarousel
              key={`${item.id}-${variant.id}`}
              images={images}
              title={titleOf(item, lang)}
              lang={lang}
              detail
              autoPlay={
                catalog.homepageCatalog?.packages?.imageAutoPlay ?? true
              }
              intervalSeconds={
                catalog.homepageCatalog?.packages?.imageIntervalSeconds ?? 5
              }
            />
          </div>
          <div className="detail-panel">
            <p className="section-kicker">{item.area}</p>
            <h1>{titleOf(item, lang)}</h1>
            <p className="detail-subtitle">{descOf(item, lang)}</p>
            <div className="trip-facts">
              <span>
                <Clock3 size={16} />
                <strong>
                  {item.duration} {t("hari")}
                </strong>
              </span>
              {item.trail && (
                <span>
                  <MapPin size={16} />
                  <strong>{item.trail}</strong>
                </span>
              )}
              <span>
                <Mountain size={16} />
                <strong>{item.theme || "Trip"}</strong>
              </span>
              {malaysia && (
                <span>
                  <UsersRound size={16} />
                  <strong>{t("Minimal 4 pax")}</strong>
                </span>
              )}
            </div>
            {variants.length > 1 && (
              <div className="variant-selector">
                <span className="variant-selector-label">
                  {t("Pilih varian trip")}
                </span>
                <div className="variant-options">
                  {variants.map((entry) => {
                    const active = entry.id === variant.id;
                    return (
                      <button
                        type="button"
                        className={active ? "active" : ""}
                        onClick={() => setSelectedVariantId(entry.id)}
                        key={entry.id}
                      >
                        <strong>{entry.code || "A"}</strong>
                        <span>
                          {lang === "en"
                            ? entry.enTitle || entry.title
                            : entry.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="detail-price">
              <span>{t("Mulai dari")}</span>
              {hasPrice ? (
                <>
                  {money(
                    malaysia ? Math.round(perPax / 3550) : perPax,
                    malaysia ? "MYR" : "IDR",
                  )}{" "}
                  <small>/pax</small>
                </>
              ) : (
                t("Sesuai request")
              )}
            </div>
            {hasPrice && (
              <div className="detail-calculator">
                <label>
                  {t("Jumlah peserta")}
                  <select
                    value={selectedPax}
                    onChange={(event) => setPax(Number(event.target.value))}
                  >
                    {paxOptions.map((value) => (
                      <option value={value} key={value}>
                        {value} pax
                      </option>
                    ))}
                  </select>
                </label>
                <div className="calc-result">
                  <span>{t("Estimasi total")}</span>
                  <strong>
                    {money(
                      malaysia ? Math.round(total / 3550) : total,
                      malaysia ? "MYR" : "IDR",
                    )}
                  </strong>
                </div>
              </div>
            )}
            <div className="detail-actions">
              <Link
                className="button"
                to={`/book/${item.id}?variant=${variant.id}`}
              >
                {t("Tanya & booking")} <ArrowRight size={16} />
              </Link>
              <a
                className="button button-outline"
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal as="section" className="section trip-detail-content">
        <div className="trip-detail-heading">
          <div>
            <p className="section-kicker">{t("DETAIL PERJALANAN")}</p>
            <h2>{variantTitle}</h2>
          </div>
          <p>
            {t(
              "Informasi utama perjalanan disusun ringkas agar mudah dipahami sebelum mengirim permintaan booking.",
            )}
          </p>
        </div>
        <div className="trip-detail-grid">
          <article className="trip-info-card trip-itinerary-card">
            <div className="trip-info-card-head">
              <span>01</span>
              <h3>{t("Itinerary")}</h3>
            </div>
            <ol className="itinerary">
              {itinerary.map((step, index) => (
                <li key={`${step}-${index}`}>
                  <span className="itinerary-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </article>
          <article className="trip-info-card">
            <div className="trip-info-card-head">
              <span>02</span>
              <h3>{t("Fasilitas paket")}</h3>
            </div>
            <div className="inclusion-columns">
              <div>
                <h4>{t("Termasuk")}</h4>
                <ul className="detail-check-list included">
                  {included.map((entry) => (
                    <li key={entry}>
                      <CheckCircle2 size={16} aria-hidden="true" />{" "}
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>{t("Tidak termasuk")}</h4>
                <ul className="detail-check-list excluded">
                  {excluded.map((entry) => (
                    <li key={entry}>
                      <XCircle size={16} aria-hidden="true" />{" "}
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
          {priceTiers.length > 0 && (
            <article className="trip-info-card">
              <div className="trip-info-card-head">
                <span>03</span>
                <h3>{t("Harga per peserta")}</h3>
              </div>
              <div className="trip-price-list">
                {priceTiers.map((tier) => (
                  <div key={`${tier.pax}-${tier.season || "normal"}`}>
                    <span>{tier.pax} pax</span>
                    <strong>
                      {money(
                        malaysia ? Math.round(tier.price / 3550) : tier.price,
                        malaysia ? "MYR" : "IDR",
                      )}
                      <small>/pax</small>
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          )}
          <article className="trip-info-card trip-note-card">
            <div className="trip-info-card-head">
              <span>{priceTiers.length > 0 ? "04" : "03"}</span>
              <h3>{t("Catatan sebelum booking")}</h3>
            </div>
            <p>
              {note ||
                t(
                  "Harga akhir dan ketersediaan perjalanan dikonfirmasi oleh Owner melalui WhatsApp setelah permintaan booking diterima.",
                )}
            </p>
          </article>
        </div>
      </ScrollReveal>
    </main>
  );
}
