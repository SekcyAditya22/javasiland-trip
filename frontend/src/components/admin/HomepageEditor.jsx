import { useState } from "react";
import { Save } from "lucide-react";
import { EditorCard } from "./AdminFormUI";
import MediaGalleryEditor from "./MediaGalleryEditor";

export default function HomepageEditor({ section, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "",
    enTitle: "",
    body: "",
    enBody: "",
    image: "",
    gallery: [],
    imageSettings: { ratio: "16/9", items: [] },
    sortOrder: 1,
    visible: true,
    ...section,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = saving || uploading;
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, sortOrder: Number(form.sortOrder) });
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <EditorCard
      title={`Edit section: ${section.sectionKey}`}
      onClose={() => !busy && onClose()}
    >
      <form className="admin-form" onSubmit={submit}>
        <fieldset className="blog-editor-fields" disabled={busy}>
          <div className="admin-form-grid">
            {[
              ["title", "Judul"],
              ["enTitle", "Judul English"],
              ["body", "Isi"],
              ["enBody", "Isi English"],
            ].map(([key, label]) => (
              <label className="field" key={key}>
                {label}
                {key.toLowerCase().includes("title") ? (
                  <input
                    value={form[key]}
                    maxLength={180}
                    onChange={(event) => update(key, event.target.value)}
                  />
                ) : (
                  <textarea
                    rows={4}
                    maxLength={20000}
                    value={form[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                )}
              </label>
            ))}
            <label className="field">
              Urutan
              <input
                type="number"
                value={form.sortOrder}
                min={-100000}
                max={100000}
                onChange={(event) => update("sortOrder", event.target.value)}
              />
            </label>
            <label className="field">
              Status
              <select
                value={String(form.visible)}
                onChange={(event) =>
                  update("visible", event.target.value === "true")
                }
              >
                <option value="true">Tampil</option>
                <option value="false">Sembunyi</option>
              </select>
            </label>
            <div className="full">
              <MediaGalleryEditor
                value={form}
                disabled={busy}
                onBusyChange={setUploading}
                onChange={(patch) =>
                  setForm((current) => ({ ...current, ...patch }))
                }
              />
            </div>
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="blog-editor-actions">
          <button
            className="button button-outline"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Batal
          </button>
          <button className="button" type="submit" disabled={busy}>
            <Save size={15} />{" "}
            {uploading
              ? "Mengunggah…"
              : saving
                ? "Menyimpan…"
                : "Simpan konten"}
          </button>
        </div>
      </form>
    </EditorCard>
  );
}
