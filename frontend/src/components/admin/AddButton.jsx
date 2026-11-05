import { Plus } from "lucide-react";

export default function AddButton({ children, variant = "primary", ...props }) {
  return (
    <button type="button" className={`admin-add-button ${variant}`} {...props}>
      <span className="admin-add-button-icon" aria-hidden="true">
        <Plus size={17} strokeWidth={2} />
      </span>
      <span>{children}</span>
    </button>
  );
}
