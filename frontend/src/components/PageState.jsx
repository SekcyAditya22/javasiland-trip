import { Link } from "react-router-dom";

export default function PageState({
  code,
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <main className="page-state">
      <section className="page-state-card">
        <div className="page-state-symbol" aria-hidden="true">
          <Icon size={32} />
        </div>
        <p className="section-kicker">{code}</p>
        <h1>{title}</h1>
        <p className="page-state-description">{description}</p>
        <div className="page-state-actions">{children}</div>
      </section>
    </main>
  );
}

export function HomeLink({ lang }) {
  return (
    <Link className="button button-outline" to="/">
      {lang === "en" ? "Back to home" : "Kembali ke beranda"}
    </Link>
  );
}
