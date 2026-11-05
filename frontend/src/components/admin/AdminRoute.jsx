import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../lib/api";
import AdminDashboard from "../../pages/admin/AdminDashboard";

export default function AdminRoute() {
  const [session, setSession] = useState(undefined);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    api
      .session()
      .then(({ user }) => {
        if (active) setSession(user);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) setSession(null);
        else setError("Tidak dapat terhubung ke server. Silakan coba kembali.");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (error)
    return (
      <main className="admin-page">
        <div className="admin-login-card">
          <h1>Koneksi bermasalah</h1>
          <p role="alert">{error}</p>
          <button
            className="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Coba kembali
          </button>
        </div>
      </main>
    );
  if (session === undefined)
    return (
      <main
        className="admin-session-pending"
        aria-busy="true"
        aria-label="Memeriksa sesi"
      />
    );
  if (!session) return <Navigate to="/login-admin" replace />;
  return <AdminDashboard user={session} />;
}
