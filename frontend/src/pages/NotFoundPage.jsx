import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import PageState, { HomeLink } from "../components/PageState";

export default function NotFoundPage({ lang = "id" }) {
  return (
    <PageState
      code="404 · JAVA ISLAND TRIP"
      icon={MapPinOff}
      title={
        lang === "en"
          ? "This destination could not be found."
          : "Halaman tidak ditemukan."
      }
      description={
        lang === "en"
          ? "The link may have changed, or this trip is no longer available. Let’s find another journey for you."
          : "Tautan mungkin sudah berubah atau perjalanan ini belum tersedia. Temukan perjalanan lainnya melalui daftar paket kami."
      }
    >
      <Link className="button" to="/packages">
        {lang === "en" ? "Explore packages" : "Jelajahi paket"}
      </Link>
      <HomeLink lang={lang} />
    </PageState>
  );
}
