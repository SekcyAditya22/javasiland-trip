import { translate } from "../../lib/i18n";
import { Link } from "react-router-dom";
import { ArrowRight, Car, Sparkles } from "lucide-react";
import ScrollReveal from "../ScrollReveal";

export default function ServiceCards({ lang }) {
  const t = (text) => translate(lang, text);
  return (
    <ScrollReveal as="section" className="section service-section">
      <div className="section-head compact">
        <p className="section-kicker">
          {lang === "en" ? "CHOOSE WHAT YOU NEED" : "PILIH KEBUTUHANMU"}
        </p>
        <h2>
          {lang === "en"
            ? "Two ways to explore Java."
            : "Dua cara untuk menjelajah Jawa."}
        </h2>
      </div>
      <div className="service-grid">
        <Link className="service-card service-trip" to="/packages">
          <Sparkles />
          <div>
            <p className="section-kicker">TRIP PACKAGES</p>
            <h3>{lang === "en" ? "Trip Packages" : "Paket Trip"}</h3>
            <p>{t("Rute terkurasi dengan itinerary dan kalkulator instan.")}</p>
            <span className="link-arrow">
              {t("Lihat pilihan")} <ArrowRight size={15} />
            </span>
          </div>
        </Link>
        <Link className="service-card service-rental" to="/rental">
          <Car />
          <div>
            <p className="section-kicker">CAR RENTAL</p>
            <h3>{lang === "en" ? "Car Rental" : "Rental Mobil"}</h3>
            <p>{t("Armada terawat dengan driver untuk perjalanan pribadi.")}</p>
            <span className="link-arrow">
              {t("Lihat pilihan")} <ArrowRight size={15} />
            </span>
          </div>
        </Link>
      </div>
    </ScrollReveal>
  );
}
