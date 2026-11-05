import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { isMalaysia } from "../../lib/catalog";
import HeroVisual from "./HeroVisual";

export default function Hero({ lang, catalog }) {
  const local = catalog.packages.filter((p) => !isMalaysia(p));
  const heroSection = catalog.homepage?.find(
    (item) => item.sectionKey === "hero",
  );
  const heroCopy =
    lang === "en"
      ? heroSection?.enBody ||
        heroSection?.body ||
        "Thoughtfully designed trips, driver-led vehicles, and local people who know every beautiful corner."
      : heroSection?.body ||
        "Paket trip yang dirancang dengan hati, kendaraan dengan driver yang siap menemani, dan tim lokal yang tahu setiap sudut terbaiknya.";
  return (
    <>
      {catalog.homepageVisibility?.hero !== false && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              {lang === "en"
                ? "YOGYAKARTA & CENTRAL JAVA"
                : "JOGJA & JAWA TENGAH"}
            </p>
            <h1>
              {lang === "en"
                ? heroSection?.enTitle ||
                  heroSection?.title ||
                  "See Java, in a more meaningful way."
                : heroSection?.title ||
                  "Jelajah Jawa, dengan cara yang lebih berarti."}
            </h1>
            <p>{heroCopy}</p>
            <div className="hero-actions">
              <Link className="button" to="/#panel">
                {lang === "en" ? "Start exploring" : "Mulai menjelajah"}{" "}
                <ArrowRight size={16} />
              </Link>
              <Link className="button button-outline" to="/rental">
                {lang === "en" ? "Browse car rental" : "Lihat rental mobil"}
              </Link>
            </div>
            <div className="trust-row">
              <div>
                <strong>{catalog.packages.length}</strong>
                <span>
                  {lang === "en" ? "Curated packages" : "Paket pilihan"}
                </span>
              </div>
              <div>
                <strong>IDR / RM</strong>
                <span>
                  {lang === "en" ? "Clear pricing" : "Harga transparan"}
                </span>
              </div>
              <div>
                <strong>20 min</strong>
                <span>{lang === "en" ? "Fast response" : "Respons cepat"}</span>
              </div>
            </div>
          </div>
          <HeroVisual section={heroSection} lang={lang} />
        </section>
      )}
      <section className="section panel-section" id="panel">
        <div className="section-head compact">
          <p className="section-kicker">
            {lang === "en" ? "CHOOSE YOUR PANEL" : "PILIH PANEL PERJALANANMU"}
          </p>
          <h2>
            {lang === "en"
              ? "Two ways to travel with us."
              : "Dua cara untuk menjelajah bersama kami."}
          </h2>
          <p>
            {lang === "en"
              ? "Malaysia hiking packages are priced in RM. Trip & car rental use IDR."
              : "Paket hiking Malaysia dihargai dalam RM. Trip & rental mobil memakai IDR."}
          </p>
        </div>
        <div className="panel-bubbles">
          <Link className="panel-bubble panel-malaysia" to="/malaysia">
            <span className="bubble-badge solid">🇲🇾 RM ONLY</span>
            <h3>
              {lang === "en" ? "Malaysia Hiking Trip" : "Trip Hiking Malaysia"}
            </h3>
            <p>
              {catalog.packages.filter(isMalaysia).length}{" "}
              {lang === "en"
                ? "curated mountain trips for Malaysian guests."
                : "paket pendakian pilihan untuk tamu Malaysia."}
            </p>
            <span className="bubble-cta">
              {lang === "en" ? "Explore Malaysia trips" : "Lihat trip Malaysia"}{" "}
              →
            </span>
          </Link>
          <Link className="panel-bubble panel-umum" to="/packages">
            <span className="bubble-badge">IDR · UNIVERSAL</span>
            <h3>
              {lang === "en" ? "Trip & Car Rental" : "Trip & Rental Mobil"}
            </h3>
            <p>
              {local.length}{" "}
              {lang === "en"
                ? "trips plus a well-maintained fleet with driver."
                : "paket trip dan armada terawat lengkap dengan driver."}
            </p>
            <span className="bubble-cta">
              {lang === "en" ? "Browse trips & rental" : "Lihat trip & rental"}{" "}
              →
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
