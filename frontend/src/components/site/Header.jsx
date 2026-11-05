import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MessageCircle, Settings, X } from "lucide-react";
import { PHONE } from "../../lib/catalog";

const NAVIGATION = [
  { to: "/", idLabel: "Home", enLabel: "Home", exact: true },
  { to: "/malaysia", idLabel: "Malaysia Trip", enLabel: "Malaysia Trip" },
  { to: "/packages", idLabel: "Paket Trip", enLabel: "Trip Packages" },
  { to: "/rental", idLabel: "Rental Mobil", enLabel: "Car Rental" },
  { to: "/blog", idLabel: "Blog", enLabel: "Blog" },
  { to: "/#promo", idLabel: "Promo", enLabel: "Offers", hash: "#promo" },
  {
    to: "/#about",
    idLabel: "Tentang Kami",
    enLabel: "About Us",
    hash: "#about",
  },
  { to: "/#faq", idLabel: "FAQ", enLabel: "FAQ", hash: "#faq" },
];

const isCurrentPage = (item, pathname, hash) => {
  if (item.hash) return pathname === "/" && hash === item.hash;
  if (item.exact) {
    const sectionHashes = NAVIGATION.filter((navItem) => navItem.hash).map(
      (navItem) => navItem.hash,
    );
    return pathname === item.to && !sectionHashes.includes(hash);
  }
  if (item.to === "/packages") {
    return pathname === "/packages" || pathname.startsWith("/packages/");
  }
  if (item.to === "/malaysia") {
    return pathname === "/malaysia" || pathname.startsWith("/malaysia/");
  }
  if (item.to === "/rental") {
    return pathname === "/rental" || pathname.startsWith("/vehicle/");
  }
  if (item.to === "/blog") {
    return pathname === "/blog" || pathname.startsWith("/blog/");
  }
  return pathname === item.to;
};

export default function Header({ lang, onSettings }) {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">JI</span>
        <span>
          <strong>JAVA ISLAND</strong>
          <small>TRIP</small>
        </span>
      </Link>
      <button
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-label={lang === "en" ? "Open menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="primary-navigation"
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav
        id="primary-navigation"
        className={open ? "site-nav open" : "site-nav"}
        aria-label={lang === "en" ? "Main navigation" : "Navigasi utama"}
      >
        {NAVIGATION.map((item) => {
          const active = isCurrentPage(item, pathname, hash);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {lang === "en" ? item.enLabel : item.idLabel}
            </Link>
          );
        })}
      </nav>
      <div className="header-actions">
        <button
          className="gear-btn"
          onClick={onSettings}
          aria-label={lang === "en" ? "Settings" : "Pengaturan"}
        >
          <Settings size={18} />
        </button>
        <a
          className="button button-sm header-wa"
          href={`https://wa.me/${PHONE}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={15} /> WhatsApp
        </a>
      </div>
    </header>
  );
}
