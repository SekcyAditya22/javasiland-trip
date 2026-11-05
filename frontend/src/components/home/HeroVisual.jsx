import ImageCarousel from "../ImageCarousel";
import { imageList } from "../../lib/images";
import { mediaRatio } from "../../lib/media";

export default function HeroVisual({ section, lang }) {
  const gallery = imageList(section?.image, section?.gallery);
  return (
    <div className="hero-visual">
      <div
        className="hero-visual-card"
        style={section?.imageSettings ? { height: "auto" } : undefined}
      >
        <ImageCarousel
          images={
            gallery.length
              ? gallery
              : ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4"]
          }
          title={lang === "en" ? "Discover Java" : "Jelajah Jawa"}
          imageSettings={section?.imageSettings}
          aspectRatio={
            section?.imageSettings
              ? mediaRatio(section.imageSettings)
              : undefined
          }
          priority
          lang={lang}
          className="hero-carousel"
        />
        <div className="hero-route-label">
          <span className="hero-route-dot" />
          JAVA ISLAND · 2026
        </div>
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-note">
          <div>
            <span>{lang === "en" ? "Next stop" : "Perjalanan berikutnya"}</span>
            <strong>Sunrise Prau &amp; Merbabu</strong>
            <small>
              {lang === "en"
                ? "Dieng highlands · Central Java"
                : "Dataran tinggi Dieng · Jawa Tengah"}
            </small>
          </div>
          <span className="mini-mark">✦</span>
        </div>
      </div>
    </div>
  );
}
