import { useRef } from "react";
import { Move, RotateCcw } from "lucide-react";
import SmartImage from "../SmartImage";
import {
  imageFrame,
  imageFrameStyle,
  mediaRatio,
  MEDIA_RATIOS,
  updateImageFrame,
} from "../../lib/media";

export default function ImageFramingEditor({
  src,
  settings,
  onChange,
  disabled,
}) {
  const pointer = useRef(null);
  const frame = imageFrame(settings, src);
  const update = (patch) => onChange(updateImageFrame(settings, src, patch));
  const clamp = (value) => Math.max(0, Math.min(100, value));
  const end = () => {
    pointer.current = null;
  };
  return (
    <section className="image-framing-editor">
      <div className="image-framing-head">
        <div>
          <h4>Posisi & ukuran gambar</h4>
          <p>
            Pilih Atur gambar pada galeri. Geser foto pada pratinjau, atau
            gunakan kontrol di bawah.
          </p>
        </div>
        <Move size={20} />
      </div>
      <div className="image-framing-layout">
        <div
          className="image-framing-stage"
          style={{ aspectRatio: mediaRatio(settings) }}
          onPointerDown={(event) => {
            if (disabled || event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            const bounds = event.currentTarget.getBoundingClientRect();
            pointer.current = {
              left: event.clientX,
              top: event.clientY,
              x: frame.x,
              y: frame.y,
              width: bounds.width,
              height: bounds.height,
            };
          }}
          onPointerMove={(event) => {
            const start = pointer.current;
            if (!start || disabled) return;
            update({
              x: Math.round(
                clamp(
                  start.x - ((event.clientX - start.left) / start.width) * 100,
                ),
              ),
              y: Math.round(
                clamp(
                  start.y - ((event.clientY - start.top) / start.height) * 100,
                ),
              ),
            });
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          aria-label="Pratinjau posisi gambar"
        >
          <SmartImage
            src={src}
            alt="Pratinjau gambar terpilih"
            imageStyle={imageFrameStyle(settings, src)}
            width={960}
            priority
          />
          <span className="image-framing-guide">
            <Move size={14} /> Geser foto
          </span>
        </div>
        <div className="image-framing-controls">
          <label className="field">
            Rasio galeri
            <select
              value={mediaRatio(settings)}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ratio: event.target.value,
                  items: settings?.items || [],
                })
              }
            >
              {MEDIA_RATIOS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Tampilan gambar
            <select
              value={frame.fit}
              disabled={disabled}
              onChange={(event) => update({ fit: event.target.value })}
            >
              <option value="cover">Penuhi frame</option>
              <option value="contain">Tampilkan utuh</option>
            </select>
          </label>
          {[
            ["zoom", "Zoom", 1, 2.5, 0.05],
            ["x", "Posisi horizontal", 0, 100, 1],
            ["y", "Posisi vertikal", 0, 100, 1],
          ].map(([key, label, min, max, step]) => (
            <label className="media-range" key={key}>
              <span>
                {label}
                <output>
                  {key === "zoom"
                    ? `${Math.round(frame[key] * 100)}%`
                    : `${frame[key]}%`}
                </output>
              </span>
              <input
                type="range"
                aria-label={label}
                value={frame[key]}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                onChange={(event) =>
                  update({ [key]: Number(event.target.value) })
                }
              />
            </label>
          ))}
          <button
            type="button"
            className="small-btn"
            disabled={disabled}
            onClick={() => update({ x: 50, y: 50, zoom: 1, fit: "cover" })}
          >
            <RotateCcw size={14} /> Reset gambar
          </button>
        </div>
      </div>
      <p className="field-hint">
        Pengaturan diterapkan saat disimpan. File asli tetap tersedia; kartu
        memakai frame tetap agar susunannya rapi.
      </p>
    </section>
  );
}
