import { translate } from "../lib/i18n";
import PageHero from "../components/PageHero";
import VehicleCard from "../components/VehicleCard";
import ScrollReveal from "../components/ScrollReveal";

export default function RentalPage({ catalog, lang }) {
  const t = (text) => translate(lang, text);
  return (
    <main>
      <PageHero
        kicker="JAVA ISLAND TRIP · IDR UNIVERSAL"
        title={lang === "en" ? "Car Rental" : "Rental Mobil"}
        desc={t(
          "Kendaraan dengan driver yang terawat dan tim yang siap membantu.",
        )}
      />
      <ScrollReveal as="section" className="section catalog-section">
        <div className="fleet-grid">
          {catalog.fleet.map((vehicle, index) => (
            <VehicleCard
              vehicle={vehicle}
              lang={lang}
              priority={index === 0}
              carouselSettings={catalog.homepageCatalog?.fleet}
              key={vehicle.id}
            />
          ))}
        </div>
      </ScrollReveal>
    </main>
  );
}
