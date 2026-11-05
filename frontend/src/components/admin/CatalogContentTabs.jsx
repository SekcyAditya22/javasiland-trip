import { List, Settings2 } from "lucide-react";

export default function CatalogContentTabs({ tab, onChange, label }) {
  return (
    <div className="blog-admin-tabs" aria-label={`Tampilan ${label}`}>
      <button
        type="button"
        className={tab === "items" ? "active" : ""}
        aria-pressed={tab === "items"}
        onClick={() => onChange("items")}
      >
        <List size={16} />
        Daftar {label}
      </button>
      <button
        type="button"
        className={tab === "homepage" ? "active" : ""}
        aria-pressed={tab === "homepage"}
        onClick={() => onChange("homepage")}
      >
        <Settings2 size={16} />
        Tampilan homepage
      </button>
    </div>
  );
}
