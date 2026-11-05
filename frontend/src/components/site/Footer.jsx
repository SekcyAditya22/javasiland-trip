import { translate } from "../../lib/i18n";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { PHONE } from "../../lib/catalog";

export default function Footer({ lang }) {
  const t = (text) => translate(lang, text);
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link to="/" className="brand brand-light">
            <span className="brand-mark">JI</span>
            <span>
              <strong>JAVA ISLAND</strong>
              <small>TRIP</small>
            </span>
          </Link>
          <p>
            {lang === "en"
              ? "Journeys that feel close, stories that stay longer."
              : "Perjalanan yang terasa dekat, cerita yang tinggal lebih lama."}
          </p>
        </div>
        <div>
          <h4>{lang === "en" ? "Explore" : "Jelajahi"}</h4>
          <Link to="/malaysia">Malaysia Trip</Link>
          <Link to="/packages">{t("Paket Trip")}</Link>
          <Link to="/rental">{t("Rental Mobil")}</Link>
          <Link to="/#faq">FAQ</Link>
          <Link to="/blog">Blog</Link>
        </div>
        <div>
          <h4>{lang === "en" ? "Contact us" : "Hubungi kami"}</h4>
          <a href={`https://wa.me/${PHONE}`}>+62 878-3945-6221</a>
          <a href="mailto:hello@javaislandtrip.com">hello@javaislandtrip.com</a>
          <span>Yogyakarta, Indonesia</span>
        </div>
        <div>
          <h4>{lang === "en" ? "Follow the journey" : "Ikuti perjalanan"}</h4>
          <div className="socials">
            <a href="#" aria-label="Instagram">
              <Instagram size={17} />
            </a>
            <a href="#" aria-label="TikTok">
              tk
            </a>
            <a href="#" aria-label="Facebook">
              fb
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 JAVA ISLAND TRIP</span>
        <span>{t("Syarat & Ketentuan | Kebijakan Privasi")}</span>
      </div>
    </footer>
  );
}
