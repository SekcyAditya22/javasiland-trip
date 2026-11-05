import { WifiOff, RefreshCw } from "lucide-react";
import PageState, { HomeLink } from "./PageState";

export default function CatalogError({ lang, retry }) {
  return (
    <PageState
      code={lang === "en" ? "PLEASE TRY AGAIN" : "COBA BEBERAPA SAAT LAGI"}
      icon={WifiOff}
      title={
        lang === "en"
          ? "We couldn’t load this page yet."
          : "Halaman belum dapat dimuat."
      }
      description={
        lang === "en"
          ? "Please check your connection and try again. We’ll keep your place here."
          : "Periksa koneksi Anda, lalu coba kembali. Anda tetap berada di halaman yang sama."
      }
    >
      <button type="button" className="button" onClick={retry}>
        <RefreshCw size={16} />
        {lang === "en" ? "Try again" : "Coba kembali"}
      </button>
      <HomeLink lang={lang} />
    </PageState>
  );
}
