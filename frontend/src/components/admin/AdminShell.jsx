import { Link } from "react-router-dom";
import {
  CarFront,
  ClipboardList,
  ExternalLink,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Settings,
  Star,
  Tag,
  Users,
  BookOpen,
  X,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "packages", label: "Paket Trip", icon: Package },
  { key: "fleet", label: "Unit Armada", icon: CarFront },
  { key: "promos", label: "Promo", icon: Tag },
  { key: "faqs", label: "FAQ", icon: HelpCircle },
  { key: "blog", label: "Blog", icon: BookOpen },
  { key: "homepage", label: "Konten Homepage", icon: Home },
  { key: "bookings", label: "Booking", icon: ClipboardList },
  { key: "reviews", label: "Review", icon: Star },
  { key: "users", label: "Users", icon: Users, ownerOnly: true },
  { key: "settings", label: "Settings", icon: Settings },
];

function AdminBrand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">JI</span>
      <span>
        <strong>JAVA ISLAND</strong>
        <small>TRIP</small>
      </span>
    </Link>
  );
}

export function AdminSidebar({ activeTab, onSelect, open, close, role }) {
  return (
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <div className="admin-sidebar-brand">
        <AdminBrand />
        <button
          className="admin-sidebar-close"
          onClick={close}
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
      </div>
      <p className="admin-sidebar-label">OWNER CONTROL</p>
      <nav className="admin-nav">
        {ADMIN_NAV_ITEMS.filter(
          (item) => !item.ownerOnly || role === "OWNER",
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={activeTab === key ? "active" : ""}
            onClick={() => onSelect(key)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <Link to="/" target="_blank">
          <ExternalLink size={15} /> Lihat website
        </Link>
      </div>
    </aside>
  );
}

export function AdminTopbar({ title, onMenu, onRefresh, onLogout, loading }) {
  return (
    <header className="admin-topbar">
      <button
        className="admin-menu-button"
        onClick={onMenu}
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>
      <div className="admin-topbar-title">
        <p className="section-kicker">JAVA ISLAND TRIP · ADMIN</p>
        <h2>{title}</h2>
      </div>
      <div className="admin-topbar-actions">
        <button className="small-btn" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
        <Link className="small-btn" to="/" target="_blank">
          <ExternalLink size={14} /> Website
        </Link>
        <button className="small-btn danger" onClick={onLogout}>
          <LogOut size={14} /> Keluar
        </button>
      </div>
    </header>
  );
}
