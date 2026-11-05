import { translate } from "../../lib/i18n";
import { X } from "lucide-react";

export default function SettingsModal({
  lang,
  langMode,
  region,
  chooseLang,
  chooseRegion,
  close,
}) {
  const t = (text) => translate(lang, text);
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className="settings-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-head">
          <h3>{t("Pengaturan")}</h3>
          <button onClick={close} aria-label={t("Tutup")}>
            <X size={18} />
          </button>
        </div>
        <p className="section-kicker">Wilayah / Region</p>
        <div className="settings-options">
          <button
            className={region === "id" ? "active" : ""}
            onClick={() => chooseRegion("id")}
          >
            🇮🇩{" "}
            <span>
              Indonesia<small>IDR</small>
            </span>
          </button>
          <button
            className={region === "my" ? "active" : ""}
            onClick={() => chooseRegion("my")}
          >
            🇲🇾{" "}
            <span>
              Malaysia<small>RM</small>
            </span>
          </button>
        </div>
        <p className="section-kicker">Bahasa / Language</p>
        <div className="settings-options">
          <button
            className={langMode === "auto" ? "active" : ""}
            onClick={() => chooseLang("auto")}
          >
            AUTO{" "}
            <span>
              {lang === "en" ? "Browser language" : "Ikuti bahasa browser"}
            </span>
          </button>
          <button
            className={langMode === "id" ? "active" : ""}
            onClick={() => chooseLang("id")}
          >
            ID <span>Indonesia</span>
          </button>
          <button
            className={langMode === "en" ? "active" : ""}
            onClick={() => chooseLang("en")}
          >
            EN <span>English</span>
          </button>
        </div>
      </section>
    </div>
  );
}
