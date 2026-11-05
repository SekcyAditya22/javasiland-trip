import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import PageTransition from "../../components/PageTransition";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [retryUntil, setRetryUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const sync = () =>
      setRemaining(Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)));
    sync();
    if (!retryUntil) return;
    const timer = window.setInterval(sync, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting || remaining) return;
    setSubmitting(true);
    setError("");
    try {
      await api.login(form);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
      if (err.retryAfter) setRetryUntil(Date.now() + err.retryAfter * 1000);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="admin-page">
      <PageTransition className="admin-login-card">
        <Link to="/" className="brand">
          <span className="brand-mark">JI</span>
          <span>
            <strong>JAVA ISLAND</strong>
            <small>TRIP</small>
          </span>
        </Link>
        <p className="section-kicker">OWNER CONTROL</p>
        <h1>Masuk ke Admin</h1>
        <p>Kelola katalog, booking, dan konten website.</p>
        {state?.message && <p role="status">{state.message}</p>}
        <form onSubmit={submit}>
          <label>
            Username
            <input
              value={form.username}
              autoComplete="username"
              onChange={(event) =>
                setForm({ ...form, username: event.target.value })
              }
              required
              maxLength={80}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-block"
            type="submit"
            disabled={submitting || remaining > 0}
          >
            {submitting
              ? "Memeriksa…"
              : remaining
                ? `Coba lagi dalam ${remaining >= 60 ? `${Math.ceil(remaining / 60)} menit` : `${remaining} detik`}`
                : "Masuk"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>
        <Link to="/" className="back-link">
          ← Kembali ke website
        </Link>
      </PageTransition>
    </main>
  );
}
