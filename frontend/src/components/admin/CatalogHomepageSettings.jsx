import { useState } from "react";
import { ListOrdered, Save, Shuffle, Sparkles } from "lucide-react";
import HomepageItemPicker from "./HomepageItemPicker";
import CatalogCarouselSettings from "./CatalogCarouselSettings";
import {
  homepageCatalogItems,
  HOMEPAGE_CARD_LIMIT,
  HOMEPAGE_POOL_LIMIT,
} from "../../lib/homepageCatalog";

const modes = [
  {
    value: "AUTO",
    label: "Otomatis",
    description: "Tampilkan 3 pilihan pertama sesuai urutan katalog.",
    icon: Sparkles,
  },
  {
    value: "MANUAL",
    label: "Pilihan admin",
    description: "Pilih daftar kartu dan atur urutan pergantiannya sendiri.",
    icon: ListOrdered,
  },
  {
    value: "RANDOM",
    label: "Acak",
    description: "Pilihan diacak saat homepage dimuat kembali.",
    icon: Shuffle,
  },
];

export default function CatalogHomepageSettings({
  settings,
  items,
  onSave,
  onError,
}) {
  const [form, setForm] = useState(() => ({
    ...settings,
    selectedIds: [...settings.selectedIds],
  }));
  const [saving, setSaving] = useState(false);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const fleet = settings.kind === "fleet";
  const label = fleet ? "armada" : "paket";
  const choices = homepageCatalogItems(settings.kind, items, true);
  const publishedIds = new Set(
    homepageCatalogItems(settings.kind, items).map((item) => String(item.id)),
  );
  const count =
    form.mode === "MANUAL"
      ? Math.min(
          HOMEPAGE_CARD_LIMIT,
          form.selectedIds.filter((id) => publishedIds.has(id)).length,
        )
      : Math.min(HOMEPAGE_CARD_LIMIT, publishedIds.size);
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset className="blog-editor-fields" disabled={saving}>
        <div className="blog-settings-heading">
          <div>
            <h3>Pilihan {label} di homepage</h3>
            <p>
              Atur kartu yang dilihat customer. Tiga kartu pilihan dilengkapi
              satu kartu “Lihat lainnya” menuju{" "}
              {fleet ? "halaman rental" : "semua paket trip"}.
            </p>
          </div>
          <label className="blog-visibility-switch">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(event) => update("visible", event.target.checked)}
            />
            Tampilkan di homepage
          </label>
        </div>
        <CatalogCarouselSettings form={form} update={update} />
        <div className="admin-form-grid">
          <label className="field">
            Judul bagian Indonesia
            <input
              value={form.title}
              maxLength={180}
              required
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label className="field">
            Judul bagian English
            <input
              value={form.enTitle}
              maxLength={180}
              placeholder="Opsional, mengikuti judul Indonesia"
              onChange={(event) => update("enTitle", event.target.value)}
            />
          </label>
        </div>
        <h4 className="blog-settings-subtitle">Cara memilih {label}</h4>
        <div className="blog-mode-grid catalog-mode-grid">
          {modes.map(({ value, label, description, icon: Icon }) => (
            <label
              className={`blog-mode-choice ${form.mode === value ? "active" : ""}`}
              key={value}
            >
              <input
                type="radio"
                name={`homepage-${settings.kind}-mode`}
                value={value}
                checked={form.mode === value}
                onChange={() => update("mode", value)}
              />
              <Icon size={22} />
              <strong>{label}</strong>
              <span>{description}</span>
            </label>
          ))}
        </div>
        {form.mode === "MANUAL" && (
          <HomepageItemPicker
            items={choices}
            label={label}
            selectedIds={form.selectedIds}
            onChange={(ids) => update("selectedIds", ids)}
            maxItems={HOMEPAGE_POOL_LIMIT}
          />
        )}
        <div className="catalog-homepage-summary" role="status">
          <strong>
            {form.visible
              ? `${count} kartu ${label} + 1 kartu Lihat lainnya`
              : "Bagian ini disembunyikan dari homepage"}
          </strong>
          <p>
            {fleet
              ? "Pilihan armada dan urutannya hanya mengatur homepage."
              : "Hanya paket lokal yang sudah terbit tampil ke customer. Pilihan draft tetap tersimpan di admin."}{" "}
            {form.rotateItems
              ? `Kartu berganti setiap ${form.rotationIntervalSeconds} detik jika tersedia lebih dari 3 pilihan. Semua pilihan terbit akan ditampilkan bergiliran.`
              : "Tiga pilihan pertama tetap tampil. Aktifkan pergantian otomatis untuk menampilkan pilihan lainnya secara bergiliran."}{" "}
            Katalog lengkap tetap dapat dibuka lewat Lihat lainnya.
          </p>
        </div>
      </fieldset>
      <button className="button" type="submit" disabled={saving}>
        <Save size={16} />
        {saving ? "Menyimpan…" : `Simpan tampilan ${label}`}
      </button>
    </form>
  );
}
