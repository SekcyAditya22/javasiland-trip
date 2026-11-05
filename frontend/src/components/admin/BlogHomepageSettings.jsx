import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  ListOrdered,
  Save,
  Shuffle,
  TrendingUp,
  X,
} from "lucide-react";
import { blogStatus } from "../../lib/blog";

const modes = [
  {
    value: "LATEST",
    label: "Otomatis · Terbaru",
    description: "Artikel yang baru terbit tampil lebih dahulu.",
    icon: Clock3,
  },
  {
    value: "POPULAR",
    label: "Paling banyak dibaca",
    description: "Urutkan berdasarkan jumlah pembaca, lalu tanggal terbit.",
    icon: TrendingUp,
  },
  {
    value: "MANUAL",
    label: "Pilihan admin",
    description: "Pilih sendiri artikel dan atur urutannya.",
    icon: ListOrdered,
  },
  {
    value: "RANDOM",
    label: "Acak",
    description: "Pilihan diacak saat homepage dimuat kembali.",
    icon: Shuffle,
  },
];

export default function BlogHomepageSettings({
  settings,
  posts,
  onSave,
  onError,
}) {
  const [form, setForm] = useState(() => ({
    ...settings,
    selectedIds: [...settings.selectedIds],
  }));
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const toggle = (id) =>
    update(
      "selectedIds",
      form.selectedIds.includes(id)
        ? form.selectedIds.filter((value) => value !== id)
        : [...form.selectedIds, id],
    );
  const move = (position, direction) => {
    const next = [...form.selectedIds];
    [next[position], next[position + direction]] = [
      next[position + direction],
      next[position],
    ];
    update("selectedIds", next);
  };
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
            <h3>Blog di homepage</h3>
            <p>
              Bagian ini berada tepat sebelum FAQ. Halaman /blog tetap dapat
              diakses saat bagian homepage disembunyikan.
            </p>
          </div>
          <label className="blog-visibility-switch">
            <input
              type="checkbox"
              role="switch"
              checked={form.visible}
              onChange={(event) => update("visible", event.target.checked)}
            />
            Tampilkan di homepage
          </label>
        </div>
        <div className="admin-form-grid">
          <label className="field">
            Judul bagian
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={180}
            />
          </label>
          <label className="field">
            Judul bagian English
            <input
              value={form.enTitle}
              onChange={(event) => update("enTitle", event.target.value)}
              maxLength={180}
            />
          </label>
          <label className="field">
            Deskripsi bagian
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={500}
              rows={3}
            />
          </label>
          <label className="field">
            Deskripsi bagian English
            <textarea
              value={form.enDescription}
              onChange={(event) => update("enDescription", event.target.value)}
              maxLength={500}
              rows={3}
            />
          </label>
          <label className="field">
            Jumlah artikel
            <select
              value={form.limit}
              onChange={(event) => update("limit", Number(event.target.value))}
            >
              {Array.from({ length: 9 }, (_unused, index) => (
                <option value={index + 1} key={index}>
                  {index + 1} artikel
                </option>
              ))}
            </select>
          </label>
        </div>
        <h4 className="blog-settings-subtitle">Cara memilih artikel</h4>
        <div className="blog-mode-grid">
          {modes.map(({ value, label, description, icon: Icon }) => (
            <label
              className={`blog-mode-choice ${form.mode === value ? "active" : ""}`}
              key={value}
            >
              <input
                type="radio"
                name="blog-homepage-mode"
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
          <div className="blog-manual-grid">
            <section>
              <h4>Pilih artikel</h4>
              <input
                className="blog-manual-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Cari pilihan artikel"
                placeholder="Cari judul artikel…"
              />
              <div className="blog-article-options">
                {posts
                  .filter((post) =>
                    post.title.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((post) => (
                    <label key={post.id}>
                      <input
                        type="checkbox"
                        checked={form.selectedIds.includes(post.id)}
                        disabled={
                          !form.selectedIds.includes(post.id) &&
                          form.selectedIds.length >= 50
                        }
                        onChange={() => toggle(post.id)}
                      />
                      <span>
                        <strong>{post.title}</strong>
                        <small>
                          {blogStatus(post)} · {post.views} dibaca
                        </small>
                      </span>
                    </label>
                  ))}
                {!posts.length && <p>Tambahkan artikel terlebih dahulu.</p>}
              </div>
            </section>
            <section>
              <h4>Urutan pilihan ({form.selectedIds.length})</h4>
              <p className="field-hint">
                Hanya artikel yang sudah terbit akan tampil. Draft atau jadwal
                mendatang dilewati.
              </p>
              <ol className="blog-manual-order">
                {form.selectedIds.map((id, position) => {
                  const post = posts.find((item) => item.id === id);
                  return (
                    <li key={id}>
                      <span className="blog-order-number">{position + 1}</span>
                      <span>{post?.title || "Artikel tidak tersedia"}</span>
                      <div>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={position === 0}
                          onClick={() => move(position, -1)}
                          aria-label={`Naikkan ${post?.title}`}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={position === form.selectedIds.length - 1}
                          onClick={() => move(position, 1)}
                          aria-label={`Turunkan ${post?.title}`}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => toggle(id)}
                          aria-label={`Keluarkan ${post?.title}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {!form.selectedIds.length && (
                <p className="field-hint">
                  Belum ada pilihan. Centang artikel di daftar sebelah.
                </p>
              )}
            </section>
          </div>
        )}
        <p className="field-hint">
          Jumlah pembaca dihitung setelah artikel dibuka selama 2 detik.
          Kunjungan berulang dari browser yang sama dihitung satu kali per hari.
        </p>
      </fieldset>
      <button type="submit" className="button" disabled={saving}>
        <Save size={16} />
        {saving ? "Menyimpan…" : "Simpan pengaturan blog"}
      </button>
    </form>
  );
}
