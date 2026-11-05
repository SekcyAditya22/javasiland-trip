import { Check } from "lucide-react";
import { translate } from "../../lib/i18n";
import { imageList } from "../../lib/images";
import { mediaRatio } from "../../lib/media";
import ImageCarousel from "../ImageCarousel";

export default function HomepageContent({ catalog, lang }) {
  const sections = (catalog.homepage || []).filter(
    (item) => item.sectionKey !== "hero",
  );
  if (
    !sections.some((item) => item.sectionKey === "booking_note") &&
    catalog.homepageVisibility?.booking_note !== false
  )
    sections.unshift({
      sectionKey: "booking_note",
      title: "Booking disimpan sebelum dikonfirmasi.",
      enTitle: "Your request is saved before confirmation.",
      body: "Permintaan booking tersimpan di database, diperiksa Owner, lalu dilanjutkan melalui WhatsApp.",
      enBody:
        "The Owner reviews your booking request before following up through WhatsApp.",
    });
  return sections.map((section) => {
    const images = imageList(section.image, section.gallery);
    const title =
      lang === "en" ? section.enTitle || section.title : section.title;
    const body = lang === "en" ? section.enBody || section.body : section.body;
    return (
      <section
        className={`section trust-section homepage-content-section ${images.length ? "has-gallery" : ""}`}
        id={
          section.sectionKey === "booking_note"
            ? "about"
            : `section-${section.sectionKey}`
        }
        key={section.sectionKey}
      >
        <div>
          <div className="section-head compact">
            <p className="section-kicker">
              {section.sectionKey === "booking_note"
                ? translate(lang, "CATATAN BOOKING")
                : "JAVA ISLAND TRIP"}
            </p>
            <h2>{title}</h2>
          </div>
          <div className="trust-note">
            <span className="feature-icon">
              <Check size={17} />
            </span>
            <p className="homepage-section-copy">{body}</p>
          </div>
        </div>
        {images.length > 0 && (
          <ImageCarousel
            images={images}
            title={title}
            lang={lang}
            imageSettings={section.imageSettings}
            aspectRatio={mediaRatio(section.imageSettings)}
            thumbnails
          />
        )}
      </section>
    );
  });
}
