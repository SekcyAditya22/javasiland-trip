import { ArrowRight, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { descOf, isMalaysia, money, priceFor, titleOf } from "../lib/catalog";
import ImageCarousel from "./ImageCarousel";
import { packageImages } from "../lib/images";

export default function PackageCard({
  item,
  lang,
  priority = false,
  carouselSettings,
}) {
  const malaysia = isMalaysia(item);
  const startingPrice = priceFor(item);
  const href = `${malaysia ? "/malaysia/" : "/packages/"}${item.id}`;
  return (
    <article className="card package-card">
      <ImageCarousel
        images={packageImages(item)}
        title={titleOf(item, lang)}
        href={href}
        lang={lang}
        priority={priority}
        autoPlay={carouselSettings?.imageAutoPlay ?? true}
        intervalSeconds={carouselSettings?.imageIntervalSeconds ?? 5}
        badge={
          (malaysia || item.tag) && (
            <span className={malaysia ? "badge badge-rm" : "badge"}>
              {malaysia ? "RM ONLY" : item.tag}
            </span>
          )
        }
      />
      <Link to={href} className="card-body">
        <div className="card-meta">
          <span>
            {item.area} · {item.duration} {lang === "en" ? "days" : "hari"}
          </span>
          <span>/pax</span>
        </div>
        <h3>{titleOf(item, lang)}</h3>
        <p>{descOf(item, lang)}</p>
        <div className="card-quick-info">
          {item.trail && (
            <span>
              <MapPin size={13} /> {item.trail}
            </span>
          )}
          {malaysia && (
            <span>
              <UsersRound size={13} /> Min. 4 pax
            </span>
          )}
        </div>
        <div className="card-foot">
          <div className={malaysia ? "price price-rm" : "price"}>
            {startingPrice > 0 ? (
              <>
                {money(
                  malaysia ? Math.round(startingPrice / 3550) : startingPrice,
                  malaysia ? "MYR" : "IDR",
                )}{" "}
                <small>/pax</small>
              </>
            ) : lang === "en" ? (
              "Custom price"
            ) : (
              "Harga custom"
            )}
          </div>
          <span className="link-arrow">
            {lang === "en" ? "View detail" : "Lihat detail"}{" "}
            <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </article>
  );
}
