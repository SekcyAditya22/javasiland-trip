import { translate } from "../lib/i18n";
import { useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { PHONE, money } from "../lib/catalog";
import ImageCarousel from "../components/ImageCarousel";
import { imageList } from "../lib/images";
import NotFoundPage from "./NotFoundPage";
import ScrollReveal from "../components/ScrollReveal";
import BackLink from "../components/BackLink";

export default function VehicleDetailPage({ catalog, lang }) {
  const t = (text) => translate(lang, text);
  const { id } = useParams();
  const vehicle = catalog.fleet.find(
    (entry) => String(entry.id) === String(id),
  );
  if (!vehicle) return <NotFoundPage lang={lang} />;
  const rates = catalog.rentalRates.filter(
    (rate) => String(rate.vehicleId) === String(vehicle.id),
  );
  return (
    <main>
      <ScrollReveal as="section" className="detail-page">
        <BackLink className="back-link" to="/rental">
          <ChevronLeft size={16} /> {t("Kembali")}
        </BackLink>
        <div className="detail-layout">
          <div className="detail-gallery">
            <ImageCarousel
              images={imageList(vehicle.image, vehicle.gallery)}
              title={vehicle.name}
              lang={lang}
              detail
              autoPlay={catalog.homepageCatalog?.fleet?.imageAutoPlay ?? true}
              intervalSeconds={
                catalog.homepageCatalog?.fleet?.imageIntervalSeconds ?? 5
              }
            />
          </div>
          <div className="detail-panel">
            <p className="section-kicker">{vehicle.type}</p>
            <h1>{vehicle.name}</h1>
            <p>{vehicle.specs?.join(" · ")}</p>
            <div className="vehicle-facts">
              <span>
                <strong>{vehicle.capacity}</strong>
                {t("Kapasitas")}
              </span>
              <span>
                <strong>{vehicle.transmission}</strong>
                {t("Transmisi")}
              </span>
            </div>
            <div className="rate-table">
              <h3>{t("Harga 12 jam")}</h3>
              {["driver_only", "driver_fuel", "all_in"].map((type) => (
                <div className="rate-row" key={type}>
                  <span>
                    {type === "driver_only"
                      ? t("Mobil + driver")
                      : type === "driver_fuel"
                        ? t("Driver + BBM")
                        : t("Paket All-In")}
                  </span>
                  <strong>
                    {money(
                      rates.find((rate) => rate.serviceType === type)?.price ||
                        vehicle.from,
                    )}
                  </strong>
                </div>
              ))}
            </div>
            <a
              className="button sticky-mobile-cta"
              href={`https://wa.me/${PHONE}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("Tanya & booking")} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </ScrollReveal>
    </main>
  );
}
