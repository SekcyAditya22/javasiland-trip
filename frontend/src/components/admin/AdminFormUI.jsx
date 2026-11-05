import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ImagePlus, Trash2, X } from "lucide-react";
import SmartImage from "../SmartImage";

export function ImageInput({ value, onChange, onFile }) {
  return (
    <div className="image-field">
      <div className="image-preview">
        {value ? (
          <SmartImage
            src={value}
            alt="Preview"
            width={240}
            responsive={false}
          />
        ) : (
          <ImagePlus size={25} />
        )}
      </div>
      <div>
        <label className="field">
          URL gambar
          <input
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://... atau /uploads/..."
          />
        </label>
        <label className="upload-button">
          <ImagePlus size={14} /> Upload gambar
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </label>
        <small>JPG, PNG, atau WebP. Maksimal 1 MB.</small>
      </div>
    </div>
  );
}

export function EditorCard({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <div
        className="admin-editor"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-editor-head">
          <div>
            <p className="section-kicker">FORM CRUD</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({
  open,
  itemName,
  itemType = "data",
  description,
  warning = "Tindakan ini tidak dapat dibatalkan.",
  deleting = false,
  onConfirm,
  onClose,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, deleting, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="admin-modal-backdrop delete-modal-backdrop"
      onMouseDown={deleting ? undefined : onClose}
    >
      <div
        className="delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="delete-modal-icon" aria-hidden="true">
          <AlertTriangle size={25} />
        </div>
        <div className="delete-modal-copy">
          <p className="section-kicker">KONFIRMASI HAPUS</p>
          <h3 id="delete-modal-title">Hapus {itemType} ini?</h3>
          <p id="delete-modal-description">
            <strong>{itemName || `Data ${itemType}`}</strong>{" "}
            {description ||
              "akan dihapus dari database dan tidak lagi tersedia di halaman customer."}
          </p>
          <div className="delete-modal-warning">{warning}</div>
        </div>
        <div className="delete-modal-actions">
          <button
            ref={cancelButtonRef}
            className="button button-outline"
            type="button"
            onClick={onClose}
            disabled={deleting}
          >
            Batal
          </button>
          <button
            className="button button-danger"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={15} />
            {deleting ? "Menghapus..." : "Ya, hapus"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
