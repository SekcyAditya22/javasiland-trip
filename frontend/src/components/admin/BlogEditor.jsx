import { useState } from "react";
import { Eye, PencilLine, Save } from "lucide-react";
import { EditorCard } from "./AdminFormUI";
import MediaGalleryEditor from "./MediaGalleryEditor";
import ImageCarousel from "../ImageCarousel";
import ArticleContent from "../blog/ArticleContent";
import { blogSlug, dateTimeInput, emptyBlogPost } from "../../lib/blog";
import { imageList } from "../../lib/images";
import { mediaRatio } from "../../lib/media";

export default function BlogEditor({ post, onClose, onSave, onError }) {
  const [form, setForm] = useState(() => ({
    ...emptyBlogPost(),
    ...post,
    publishedAt: dateTimeInput(post?.publishedAt),
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState("id");
  const busy = saving || uploading;
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : null,
      });
    } catch (error) {
      setError(error.message);
      onError(error);
    } finally {
      setSaving(false);
    }
  };
  return (
    <EditorCard
      title={post ? "Edit artikel" : "Tambah artikel"}
      onClose={() => !busy && onClose()}
    >
      <form className="admin-form blog-editor-form" onSubmit={submit}>
        <fieldset disabled={busy} className="blog-editor-fields">
          <div className="admin-form-grid">
            <label className="field">
              Judul Indonesia
              <input
                value={form.title}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((current) => ({
                    ...current,
                    title: value,
                    slug:
                      !post &&
                      (!current.slug ||
                        current.slug === blogSlug(current.title))
                        ? blogSlug(value)
                        : current.slug,
                  }));
                }}
                required
                maxLength={180}
              />
            </label>
            <label className="field">
              Judul English
              <input
                value={form.enTitle}
                onChange={(event) => update("enTitle", event.target.value)}
                maxLength={180}
              />
            </label>
            <label className="field full">
              Slug URL
              <input
                value={form.slug}
                onChange={(event) => update("slug", event.target.value)}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                maxLength={160}
              />
              <small className="field-hint">
                Tautan artikel: /blog/{form.slug || "judul-artikel"}
              </small>
            </label>
            <label className="field">
              Kategori
              <input
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                maxLength={60}
                placeholder="Inspirasi, Panduan, Tips perjalanan"
              />
            </label>
            <label className="field">
              Penulis
              <input
                value={form.author}
                onChange={(event) => update("author", event.target.value)}
                maxLength={100}
              />
            </label>
            <label className="field">
              Status
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Publikasikan</option>
              </select>
            </label>
            <label className="field">
              Tanggal publikasi
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => update("publishedAt", event.target.value)}
              />
              <small className="field-hint">
                Kosongkan untuk terbit saat disimpan. Tanggal mendatang
                menjadwalkan publikasi.
              </small>
            </label>
            <label className="field">
              Ringkasan Indonesia
              <textarea
                value={form.excerpt}
                onChange={(event) => update("excerpt", event.target.value)}
                rows={3}
                maxLength={500}
              />
              <small className="field-hint">
                Kosongkan untuk mengambil ringkasan dari isi artikel.
              </small>
            </label>
            <label className="field">
              Ringkasan English
              <textarea
                value={form.enExcerpt}
                onChange={(event) => update("enExcerpt", event.target.value)}
                rows={3}
                maxLength={500}
              />
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
          <div className="blog-editor-content-head">
            <div>
              <p className="section-kicker">CERITAKAN PERJALANANNYA</p>
              <h4>Isi artikel</h4>
            </div>
            <div className="blog-admin-tabs">
              <button
                type="button"
                className={!preview ? "active" : ""}
                onClick={() => setPreview(false)}
              >
                <PencilLine size={15} />
                Tulis
              </button>
              <button
                type="button"
                className={preview ? "active" : ""}
                onClick={() => setPreview(true)}
              >
                <Eye size={15} />
                Pratinjau
              </button>
            </div>
          </div>
          {preview ? (
            <div className="blog-editor-preview">
              <label className="field">
                Bahasa pratinjau
                <select
                  value={previewLang}
                  onChange={(event) => setPreviewLang(event.target.value)}
                >
                  <option value="id">Indonesia</option>
                  <option value="en">English</option>
                </select>
              </label>
              <h2>
                {previewLang === "en" ? form.enTitle || form.title : form.title}
              </h2>
              {imageList(form.image, form.gallery).length > 0 && (
                <ImageCarousel
                  images={imageList(form.image, form.gallery)}
                  title={form.title || "Artikel"}
                  lang={previewLang}
                  detail
                  aspectRatio={mediaRatio(form.imageSettings)}
                  imageSettings={form.imageSettings}
                />
              )}
              <ArticleContent
                content={
                  previewLang === "en"
                    ? form.enContent || form.content
                    : form.content
                }
                lang={previewLang}
              />
            </div>
          ) : (
            <div className="admin-form-grid">
              <label className="field full">
                Isi artikel Indonesia
                <textarea
                  value={form.content}
                  onChange={(event) => update("content", event.target.value)}
                  rows={16}
                  required
                  minLength={10}
                  maxLength={200000}
                />
              </label>
              <label className="field full">
                Isi artikel English
                <textarea
                  value={form.enContent}
                  onChange={(event) => update("enContent", event.target.value)}
                  rows={12}
                  maxLength={200000}
                />
                <small className="field-hint">
                  English bersifat opsional. Jika kosong, konten Indonesia
                  ditampilkan.
                </small>
              </label>
            </div>
          )}
          <p className="blog-format-hint">
            Pisahkan paragraf dengan baris kosong. Format:{" "}
            <code>## Subjudul</code>, <code>- Poin</code>,{" "}
            <code>1. Urutan</code>, <code>**teks tebal**</code>,{" "}
            <code>&gt; Kutipan</code>, <code>[tautan](https://...)</code>,{" "}
            <code>![keterangan](https://gambar...)</code>. Gunakan Pratinjau
            untuk memeriksa hasil.
          </p>
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
            <Save size={16} />
            {uploading
              ? "Mengunggah gambar…"
              : saving
                ? "Menyimpan…"
                : "Simpan artikel"}
          </button>
        </div>
      </form>
    </EditorCard>
  );
}
