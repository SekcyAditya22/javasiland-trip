import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ImageCarousel from "./ImageCarousel";
import { imageList } from "../lib/images";
import { money } from "../lib/catalog";
import { translate } from "../lib/i18n";

export default function VehicleCard({
  vehicle,
  lang,
  priority = false,
  carouselSettings,
}) {
  const href = `/vehicle/${vehicle.id}`;
  return (
    <article className="fleet-card">
      <ImageCarousel
        images={imageList(vehicle.image, vehicle.gallery)}
        title={vehicle.name}
        href={href}
        lang={lang}
        priority={priority}
        autoPlay={carouselSettings?.imageAutoPlay ?? true}
        intervalSeconds={carouselSettings?.imageIntervalSeconds ?? 5}
      />
      <Link className="fleet-card-content" to={href}>
        <div className="card-meta">
          <span>{vehicle.type}</span>
          <span>{vehicle.capacity || "-"} pax</span>
        </div>
        <h3>{vehicle.name}</h3>
        <div className="specs">
          {(vehicle.specs || []).slice(0, 3).map((spec) => (
            <span className="spec" key={spec}>
              {spec}
            </span>
          ))}
        </div>
        <div className="card-foot">
          <div className="price">
            {money(vehicle.from)}{" "}
            <small>/{lang === "en" ? "day" : "hari"}</small>
          </div>
          <span className="link-arrow">
            {translate(lang, "Lihat detail")} <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </article>
  );
}
