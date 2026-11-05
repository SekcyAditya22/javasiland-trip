import { ArrowRight, CarFront, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export default function CatalogSeeMoreCard({ kind, lang }) {
  const fleet = kind === "fleet";
  const en = lang === "en";
  const Icon = fleet ? CarFront : Compass;
  return (
    <Link
      className="homepage-see-more"
      to={fleet ? "/rental" : "/packages"}
      aria-label={
        fleet
          ? en
            ? "View all vehicles"
            : "Lihat semua armada"
          : en
            ? "View all packages"
            : "Lihat semua paket"
      }
    >
      <span className="homepage-more-icon" aria-hidden="true">
        <Icon size={32} strokeWidth={1.4} />
      </span>
      <div>
        <span className="homepage-more-kicker">
          {en ? "KEEP EXPLORING" : "LANJUT JELAJAH"}
        </span>
        <h3>
          {fleet
            ? en
              ? "Find your perfect ride."
              : "Armada untuk setiap rencana."
            : en
              ? "Your next adventure awaits."
              : "Masih banyak cerita lainnya."}
        </h3>
        <p>
          {fleet
            ? en
              ? "Explore more vehicles and choose the one that suits your journey."
              : "Jelajahi pilihan kendaraan lainnya, sesuai kebutuhan perjalananmu."
            : en
              ? "Discover more destinations and find a trip made for you."
              : "Temukan destinasi dan paket perjalanan lain yang cocok untukmu."}
        </p>
      </div>
      <span className="homepage-more-link">
        {en ? "See more" : "Lihat lainnya"}
        <ArrowRight size={19} aria-hidden="true" />
      </span>
    </Link>
  );
}
