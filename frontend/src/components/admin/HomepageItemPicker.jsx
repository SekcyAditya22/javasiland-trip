import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import SmartImage from "../SmartImage";
import { HOMEPAGE_CARD_LIMIT } from "../../lib/homepageCatalog";

export default function HomepageItemPicker({
  items,
  selectedIds,
  onChange,
  label,
  maxItems = HOMEPAGE_CARD_LIMIT,
}) {
  const [query, setQuery] = useState("");
  const toggle = (id) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((value) => value !== id)
        : selectedIds.length < maxItems
          ? [...selectedIds, id]
          : selectedIds,
    );
  const move = (position, direction) => {
    const next = [...selectedIds];
    [next[position], next[position + direction]] = [
      next[position + direction],
      next[position],
    ];
    onChange(next);
  };
  const results = items.filter((item) =>
    `${item.title || item.name} ${item.area || item.type}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="blog-manual-grid">
      <section>
        <h4>Pilih {label}</h4>
        <input
          className="blog-manual-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={`Cari pilihan ${label}`}
          placeholder={`Cari ${label}…`}
        />
        <div className="blog-article-options catalog-item-options">
          {results.map((item) => {
            const id = String(item.id);
            const selected = selectedIds.includes(id);
            return (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={!selected && selectedIds.length >= maxItems}
                  onChange={() => toggle(id)}
                />
                <span className="catalog-picker-image">
                  <SmartImage
                    src={item.image}
                    alt=""
                    width={100}
                    responsive={false}
                  />
                </span>
                <span>
                  <strong>{item.title || item.name}</strong>
                  <small>
                    {item.area || item.type} ·{" "}
                    {item.status === "DRAFT"
                      ? "Draft — belum tampil"
                      : "Tersedia"}
                  </small>
                </span>
              </label>
            );
          })}
          {!results.length && (
            <p className="field-hint">
              {items.length
                ? "Tidak ada pilihan yang cocok."
                : `Belum ada ${label} yang tersedia.`}
            </p>
          )}
        </div>
      </section>
      <section>
        <h4>
          Urutan pilihan ({selectedIds.length}/{maxItems})
        </h4>
        <p className="field-hint">
          Tiga kartu tampil per giliran. Gunakan panah untuk mengatur urutan.
          Mengeluarkan pilihan tidak menghapus data dari katalog.
        </p>
        <ol className="blog-manual-order">
          {selectedIds.map((id, position) => {
            const item = items.find((item) => String(item.id) === id);
            const title = item?.title || item?.name || "Item sudah dihapus";
            return (
              <li key={id}>
                <span className="blog-order-number">{position + 1}</span>
                <span>{title}</span>
                <div>
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={position === 0}
                    onClick={() => move(position, -1)}
                    aria-label={`Naikkan ${title}`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={position === selectedIds.length - 1}
                    onClick={() => move(position, 1)}
                    aria-label={`Turunkan ${title}`}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => toggle(id)}
                    aria-label={`Keluarkan ${title}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        {!selectedIds.length && (
          <p className="field-hint">
            Centang hingga {maxItems} pilihan di daftar sebelah.
          </p>
        )}
      </section>
    </div>
  );
}
