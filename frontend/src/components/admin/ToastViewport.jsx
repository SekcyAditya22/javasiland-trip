import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

function Toast({ id, message, type, onDismiss }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isError = type === "error";
  useEffect(() => {
    if (hovered || focused) return;
    const timer = window.setTimeout(() => onDismiss(id), isError ? 6000 : 4000);
    return () => window.clearTimeout(timer);
  }, [id, isError, hovered, focused, onDismiss]);
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`admin-toast ${isError ? "error" : "success"}`}
      role={isError ? "alert" : "status"}
      aria-atomic="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <span className="admin-toast-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="admin-toast-copy">
        <strong>{isError ? "Belum berhasil" : "Berhasil"}</strong>
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Tutup notifikasi"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastViewport({ notifications, onDismiss }) {
  return createPortal(
    <div className="admin-toast-viewport" aria-label="Notifikasi dashboard">
      {notifications.map((notice) => (
        <Toast key={notice.id} {...notice} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}
