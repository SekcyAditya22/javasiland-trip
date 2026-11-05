import { useId } from "react";

export default function CarouselPlaybackFields({
  title,
  description,
  label,
  enabled,
  seconds,
  min,
  max,
  onModeChange,
  onSecondsChange,
  manualHint = "Tetap pada gambar saat ini; customer dapat menggunakan tombol panah.",
}) {
  const id = useId();
  return (
    <section
      className="carousel-playback-fields"
      aria-labelledby={`${id}-title`}
    >
      <h4 id={`${id}-title`}>{title}</h4>
      <p className="field-hint">{description}</p>
      <div className="carousel-mode-toggle">
        {[false, true].map((value) => (
          <label
            className={enabled === value ? "active" : ""}
            key={String(value)}
          >
            <input
              type="radio"
              name={id}
              value={String(value)}
              checked={enabled === value}
              onChange={() => onModeChange(value)}
              aria-label={`${label} ${value ? "otomatis" : "manual"}`}
            />
            {value ? "Otomatis" : "Manual / tetap"}
          </label>
        ))}
      </div>
      <label className="field">
        Jeda pergantian {label.toLowerCase()} (detik)
        <input
          type="number"
          value={seconds}
          min={min}
          max={max}
          step="1"
          required
          disabled={!enabled}
          onChange={(event) =>
            onSecondsChange(
              event.target.value === "" ? "" : Number(event.target.value),
            )
          }
          onBlur={() => {
            if (seconds === "") onSecondsChange(min);
          }}
        />
        <small className="field-hint">
          {enabled
            ? `${min}–${max} detik. Berhenti sementara saat disentuh, diarahkan mouse, atau menggunakan keyboard.`
            : manualHint}
        </small>
      </label>
    </section>
  );
}
