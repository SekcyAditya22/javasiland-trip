import { useState } from "react";
import { Trash2 } from "lucide-react";
import AddButton from "./AddButton";
import ImageGalleryInput from "./ImageGalleryInput";
import { createVariantDraft, nextVariantCode } from "../../lib/packageForm";
import { ConfirmDeleteModal } from "./AdminFormUI";

function FormSection({ kicker, title, description, children }) {
  return (
    <section className="admin-form-section">
      <div className="admin-form-section-head">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h4>{title}</h4>
        </div>
        {description && <p>{description}</p>}
      </div>
      <div className="admin-form-grid">{children}</div>
    </section>
  );
}

function ListField({ label, value, onChange, hint, rows = 5 }) {
  return (
    <label className="field">
      {label}
      <textarea rows={rows} value={value} onChange={onChange} />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

export default function PackageFormFields({
  form,
  update,
  onImagesChange,
  onImageBusy,
  disabled,
}) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const variants = form.variantDrafts || [];
  const variant = variants[selectedVariant] || variants[0];
  const updateVariant = (key, value) => {
    update(
      "variantDrafts",
      variants.map((entry, index) =>
        index === selectedVariant ? { ...entry, [key]: value } : entry,
      ),
    );
  };
  const addVariant = () => {
    const code = nextVariantCode(variants);
    update("variantDrafts", [
      ...variants,
      createVariantDraft(
        { code, title: `${form.title || "Paket"} - Varian ${code}` },
        form,
      ),
    ]);
    setSelectedVariant(variants.length);
  };
  const removeVariant = () => {
    if (deleteIndex === null || disabled) return;
    const remaining = variants.filter((_entry, index) => index !== deleteIndex);
    update("variantDrafts", remaining);
    setSelectedVariant((current) =>
      Math.max(
        0,
        Math.min(
          current > deleteIndex ? current - 1 : current,
          remaining.length - 1,
        ),
      ),
    );
    setDeleteIndex(null);
  };

  return (
    <>
      <ConfirmDeleteModal
        open={deleteIndex !== null}
        itemType="varian"
        itemName={variants[deleteIndex]?.title || variants[deleteIndex]?.code}
        description="beserta itinerary, fasilitas, dan harga khususnya akan dikeluarkan dari paket ini."
        warning="Perubahan baru diterapkan setelah Anda klik Simpan paket. Tutup form tanpa menyimpan untuk membatalkan perubahan."
        onClose={() => setDeleteIndex(null)}
        onConfirm={removeVariant}
      />
      <FormSection
        kicker="INFORMASI UTAMA"
        title="Identitas paket"
        description="Informasi ringkas untuk kartu paket dan pencarian customer."
      >
        <label className="field">
          Judul Indonesia
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            required
          />
        </label>
        <label className="field">
          Judul English
          <input
            value={form.enTitle}
            onChange={(event) => update("enTitle", event.target.value)}
          />
        </label>
        <label className="field">
          Slug URL
          <input
            value={form.slug || ""}
            onChange={(event) => update("slug", event.target.value)}
            placeholder="contoh: prau-patakbanteng"
            disabled={Boolean(form.id)}
          />
          <small className="field-hint">
            Gunakan huruf kecil dan tanda hubung. Ditentukan saat paket dibuat.
          </small>
        </label>
        <label className="field">
          Area
          <input
            value={form.area}
            onChange={(event) => update("area", event.target.value)}
            required
          />
        </label>
        <label className="field">
          Durasi (hari)
          <input
            type="number"
            min="1"
            value={form.duration}
            onChange={(event) => update("duration", event.target.value)}
          />
        </label>
        <label className="field">
          Tema
          <input
            value={form.theme}
            onChange={(event) => update("theme", event.target.value)}
            placeholder="hiking, nature, culture"
          />
        </label>
        <label className="field">
          Jalur / meeting point
          <input
            value={form.trail || ""}
            onChange={(event) => update("trail", event.target.value)}
            placeholder="Patak Banteng"
          />
        </label>
        <label className="field">
          Badge
          <input
            value={form.tag}
            onChange={(event) => update("tag", event.target.value)}
            placeholder="Best Seller"
          />
        </label>
        <label className="field">
          Harga mulai
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(event) => update("price", event.target.value)}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="PUBLISHED">Tampil</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
        <label className="field full">
          Deskripsi Indonesia
          <textarea
            rows="4"
            value={form.desc}
            onChange={(event) => update("desc", event.target.value)}
          />
        </label>
        <label className="field full">
          Deskripsi English
          <textarea
            rows="4"
            value={form.enDesc}
            onChange={(event) => update("enDesc", event.target.value)}
          />
        </label>
        <div className="field full">
          <ImageGalleryInput
            image={form.image}
            gallery={form.gallery}
            onChange={onImagesChange}
            onBusyChange={onImageBusy}
            disabled={disabled}
          />
        </div>
      </FormSection>

      <FormSection
        kicker="DETAIL PERJALANAN"
        title="Varian dan itinerary"
        description="Isi Indonesia dan English secara terpisah. English yang kosong memakai konten Indonesia. Tulis satu agenda atau fasilitas per baris tanpa nomor."
      >
        <div className="variant-admin-toolbar full">
          <div className="variant-admin-tabs" role="tablist">
            {variants.map((entry, index) => (
              <button
                className={index === selectedVariant ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={index === selectedVariant}
                onClick={() => setSelectedVariant(index)}
                key={`${entry.code}-${index}`}
              >
                {entry.code || index + 1}
              </button>
            ))}
          </div>
          <div className="variant-admin-actions">
            {variant && (
              <button
                type="button"
                className="variant-delete-button"
                onClick={() => setDeleteIndex(selectedVariant)}
                disabled={disabled}
              >
                <Trash2 size={15} />
                Hapus varian
              </button>
            )}
            <AddButton
              variant="secondary"
              onClick={addVariant}
              disabled={disabled}
            >
              Tambah varian
            </AddButton>
          </div>
        </div>
        {!variant && (
          <div className="variant-admin-empty full">
            Belum ada varian. Paket dapat disimpan tanpa varian, atau klik
            Tambah varian untuk membuat pilihan perjalanan.
          </div>
        )}
        {variant && (
          <>
            <label className="field">
              Kode varian
              <input
                value={variant.code}
                onChange={(event) =>
                  updateVariant("code", event.target.value.toUpperCase())
                }
                maxLength="8"
                required
              />
            </label>
            <label className="field">
              Status varian
              <select
                value={variant.active ? "true" : "false"}
                onChange={(event) =>
                  updateVariant("active", event.target.value === "true")
                }
              >
                <option value="true">Aktif</option>
                <option value="false">Draft</option>
              </select>
            </label>
            <label className="field">
              Nama varian
              <input
                value={variant.title}
                onChange={(event) => updateVariant("title", event.target.value)}
                required
              />
            </label>
            <label className="field">
              Nama varian English
              <input
                value={variant.enTitle}
                onChange={(event) =>
                  updateVariant("enTitle", event.target.value)
                }
              />
            </label>
            <label className="field full">
              URL gambar utama varian
              <input
                value={variant.heroImage}
                onChange={(event) =>
                  updateVariant("heroImage", event.target.value)
                }
                placeholder="Kosongkan untuk memakai gambar utama paket"
              />
            </label>
            <ListField
              label="Harga per pax"
              value={variant.priceTiersText}
              onChange={(event) =>
                updateVariant("priceTiersText", event.target.value)
              }
              hint="Format per baris: 4: 1650000"
              rows={5}
            />
            <ListField
              label="URL galeri"
              value={variant.galleryText}
              onChange={(event) =>
                updateVariant("galleryText", event.target.value)
              }
              hint="Satu URL gambar per baris."
              rows={5}
            />
            <ListField
              label="Itinerary Indonesia"
              value={variant.itineraryText}
              onChange={(event) =>
                updateVariant("itineraryText", event.target.value)
              }
              hint="Satu agenda per baris."
            />
            <ListField
              label="Itinerary English"
              value={variant.enItineraryText}
              onChange={(event) =>
                updateVariant("enItineraryText", event.target.value)
              }
              hint="One activity per line."
            />
            <ListField
              label="Termasuk"
              value={variant.includeText}
              onChange={(event) =>
                updateVariant("includeText", event.target.value)
              }
              hint="Satu fasilitas per baris."
            />
            <ListField
              label="Included (English)"
              value={variant.enIncludeText}
              onChange={(event) =>
                updateVariant("enIncludeText", event.target.value)
              }
              hint="One item per line."
            />
            <ListField
              label="Tidak termasuk"
              value={variant.excludeText}
              onChange={(event) =>
                updateVariant("excludeText", event.target.value)
              }
              hint="Satu pengecualian per baris."
            />
            <ListField
              label="Excluded (English)"
              value={variant.enExcludeText}
              onChange={(event) =>
                updateVariant("enExcludeText", event.target.value)
              }
              hint="One item per line."
            />
            <ListField
              label="Catatan Indonesia"
              value={variant.noteText}
              onChange={(event) =>
                updateVariant("noteText", event.target.value)
              }
              rows={4}
            />
            <ListField
              label="Notes English"
              value={variant.enNoteText}
              onChange={(event) =>
                updateVariant("enNoteText", event.target.value)
              }
              rows={4}
            />
          </>
        )}
      </FormSection>
    </>
  );
}
