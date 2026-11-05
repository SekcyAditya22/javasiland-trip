import { useId, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { api } from "../../lib/api";
import { imageList, readImageFile } from "../../lib/images";
import SmartImage from "../SmartImage";

export default function ImageGalleryInput({
  image,
  gallery,
  onChange,
  onBusyChange,
  disabled = false,
  onSelectImage,
  selectedImage,
  maxImages = Infinity,
}) {
  const id = useId();
  const images = imageList(image, gallery);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const busy = uploading || disabled;
  const change = (next) =>
    onChange({ image: next[0] || "", gallery: next.slice(1) });
  const addUrl = () => {
    if (images.length >= maxImages) {
      setError(`Maksimal ${maxImages} gambar, termasuk sampul.`);
      return;
    }
    const value = url.trim();
    if (!(
      /^https?:\/\/\S+$/i.test(value) ||
      /^\/uploads\/[a-z0-9._-]+$/i.test(value)
    )) {
      setError("Gunakan URL gambar HTTP/HTTPS yang valid.");
      return;
    }
    change(imageList(images, value));
    setUrl("");
    setError("");
  };
  const upload = async (event) => {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length || busy) return;
    if (images.length + files.length > maxImages) {
      setError(
        `Maksimal ${maxImages} gambar, termasuk sampul. Hapus sebagian gambar atau pilih lebih sedikit file.`,
      );
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 1024 * 1024,
      )
    ) {
      setError("Pilih JPG, PNG, atau WebP, maksimal 1 MB per gambar.");
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    setError("");
    const uploaded = [];
    try {
      for (const file of files) {
        const result = await api.uploadImage({
          dataUrl: await readImageFile(file),
          filename: file.name,
        });
        uploaded.push(result.url);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      if (uploaded.length) change(imageList(images, uploaded));
      setUploading(false);
      onBusyChange?.(false);
    }
  };
  const move = (index, direction) => {
    const next = [...images];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    change(next);
  };

  return (
    <section
      className="image-gallery-input"
      aria-labelledby={`${id}-title`}
      aria-busy={uploading}
    >
      <div className="image-gallery-input-head">
        <div>
          <h4 id={`${id}-title`}>Galeri & carousel</h4>
          <p>
            Gambar pertama menjadi sampul. Tambahkan beberapa gambar, lalu atur
            urutannya.
          </p>
        </div>
        <span>
          {images.length}
          {Number.isFinite(maxImages) ? ` / ${maxImages}` : ""} gambar
        </span>
      </div>
      <div className="image-gallery-upload-row">
        <label className="upload-button">
          <ImagePlus size={16} />
          {uploading ? "Mengunggah…" : "Upload beberapa gambar"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={busy}
            onChange={upload}
          />
        </label>
        <small>JPG, PNG, WebP · Maksimal 1 MB per gambar.</small>
      </div>
      <div className="image-gallery-url-row">
        <label className="field" htmlFor={`${id}-url`}>
          Atau tambah URL gambar
          <input
            id={`${id}-url`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (!busy) addUrl();
              }
            }}
            disabled={busy}
            placeholder="https://..."
          />
        </label>
        <button
          type="button"
          className="small-btn"
          disabled={busy || !url.trim()}
          onClick={addUrl}
        >
          <Plus size={16} />
          Tambah gambar
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {images.length ? (
        <ol className="image-gallery-editor-list">
          {images.map((src, index) => (
            <li
              key={src}
              className={selectedImage === src ? "selected" : undefined}
            >
              <div className="image-gallery-editor-preview">
                <SmartImage
                  src={src}
                  alt={`Gambar ${index + 1}`}
                  loading="lazy"
                  width={320}
                  responsive={false}
                />
                {index === 0 && <span>Sampul</span>}
                {onSelectImage && (
                  <button
                    type="button"
                    className="image-gallery-adjust"
                    disabled={busy}
                    onClick={() => onSelectImage(src)}
                    aria-label={`Atur gambar ${index + 1}`}
                  >
                    Atur gambar
                  </button>
                )}
              </div>
              <div className="image-gallery-editor-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Jadikan sampul"
                  aria-label={`Jadikan gambar ${index + 1} sampul`}
                  disabled={busy || index === 0}
                  onClick={() =>
                    change([src, ...images.filter((entry) => entry !== src)])
                  }
                >
                  <Star size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Geser ke kiri"
                  aria-label={`Geser gambar ${index + 1} ke kiri`}
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Geser ke kanan"
                  aria-label={`Geser gambar ${index + 1} ke kanan`}
                  disabled={busy || index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  title="Hapus dari galeri"
                  aria-label={`Hapus gambar ${index + 1}`}
                  disabled={busy}
                  onClick={() =>
                    change(images.filter((entry) => entry !== src))
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="image-gallery-empty">
          <ImagePlus size={24} />
          <span>
            Belum ada gambar. Upload atau tambahkan URL untuk memulai.
          </span>
        </div>
      )}
      <p className="field-hint">
        Urutan ini digunakan pada kartu customer dan thumbnail halaman detail.
        Simpan form untuk menerapkan perubahan.
      </p>
    </section>
  );
}
