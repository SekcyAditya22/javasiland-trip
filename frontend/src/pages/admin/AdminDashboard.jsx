import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import UsersCrudPanel from "./UsersCrudPanel";
import PageTransition from "../../components/PageTransition";
import ToastViewport from "../../components/admin/ToastViewport";
import useNotifications from "../../hooks/useNotifications";
import PageLoading from "../../components/PageLoading";
import BlogCrudPanel from "./BlogCrudPanel";
import { FleetCrudPanel, PackageCrudPanel } from "./AdminCrudPanels";
import {
  FaqCrudPanel,
  HomepageCrudPanel,
  PromoCrudPanel,
} from "./ContentCrudPanels";
import {
  ADMIN_NAV_ITEMS,
  AdminSidebar,
  AdminTopbar,
} from "../../components/admin/AdminShell";
import {
  DashboardPanel,
  SettingsPanel,
  SimpleDataPanel,
  BookingTable,
} from "../../components/admin/AdminPanels";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const { notifications, notify: setNotice, dismiss } = useNotifications();
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.dashboard());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Dashboard tidak dapat dimuat.");
      setNotice(
        requestError.message || "Dashboard tidak dapat dimuat.",
        "error",
      );
      if (requestError.status === 401)
        navigate("/login-admin", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, setNotice]);
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  const selectTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };
  const confirmBooking = async (id) => {
    setConfirmingId(id);
    try {
      await api.updateBooking(id, "CONFIRMED");
      setNotice("Booking berhasil dikonfirmasi.");
      await loadDashboard();
    } catch (requestError) {
      setNotice(requestError.message || "Booking gagal diperbarui.", "error");
    } finally {
      setConfirmingId(null);
    }
  };
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      navigate("/login-admin", { replace: true });
    }
  };
  const title = useMemo(
    () =>
      ADMIN_NAV_ITEMS.find((item) => item.key === activeTab)?.label ||
      "Dashboard",
    [activeTab],
  );
  if (error && !data)
    return (
      <main className="admin-page">
        <div className="admin-login-card">
          <p className="section-kicker">OWNER CONTROL</p>
          <h1>Sesi berakhir</h1>
          <p>{error}</p>
          <Link className="button" to="/login-admin">
            Masuk kembali
          </Link>
        </div>
      </main>
    );
  return (
    <main className="admin-app">
      <ToastViewport notifications={notifications} onDismiss={dismiss} />
      <AdminSidebar
        role={user.role}
        activeTab={activeTab}
        onSelect={selectTab}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <div className="admin-main">
        <AdminTopbar
          title={title}
          onMenu={() => setSidebarOpen(true)}
          onRefresh={loadDashboard}
          onLogout={logout}
          loading={loading}
        />
        <PageTransition
          as="section"
          className="admin-content"
          transitionKey={activeTab}
        >
          {activeTab === "users" && user.role === "OWNER" && (
            <UsersCrudPanel currentUser={user} setNotice={setNotice} />
          )}
          {loading && !data ? (
            <section className="admin-card">
              <PageLoading compact />
            </section>
          ) : (
            data &&
            activeTab === "dashboard" && (
              <DashboardPanel
                data={data}
                onConfirm={confirmBooking}
                confirmingId={confirmingId}
              />
            )
          )}
          {data && activeTab === "packages" && (
            <PackageCrudPanel
              packages={data.catalog.packages}
              onRefresh={loadDashboard}
              setNotice={setNotice}
            />
          )}
          {data && activeTab === "fleet" && (
            <FleetCrudPanel
              fleet={data.catalog.fleet}
              onRefresh={loadDashboard}
              setNotice={setNotice}
            />
          )}
          {data && activeTab === "promos" && (
            <PromoCrudPanel
              promos={data.catalog.promos}
              onRefresh={loadDashboard}
              setNotice={setNotice}
            />
          )}
          {data && activeTab === "faqs" && (
            <FaqCrudPanel
              faqs={data.catalog.faqs}
              onRefresh={loadDashboard}
              setNotice={setNotice}
            />
          )}
          {data && activeTab === "blog" && (
            <BlogCrudPanel setNotice={setNotice} refreshKey={data} />
          )}
          {data && activeTab === "homepage" && (
            <HomepageCrudPanel
              sections={data.catalog.homepage}
              onRefresh={loadDashboard}
              setNotice={setNotice}
            />
          )}
          {data && activeTab === "reviews" && (
            <SimpleDataPanel tab={activeTab} catalog={data.catalog} />
          )}
          {data && activeTab === "bookings" && (
            <section className="admin-card">
              <div className="section-head">
                <div>
                  <p className="section-kicker">BOOKING INBOX</p>
                  <h2>Semua Permintaan Booking</h2>
                </div>
              </div>
              <BookingTable
                bookings={data.bookings}
                onConfirm={confirmBooking}
                confirmingId={confirmingId}
              />
            </section>
          )}
          {data && activeTab === "settings" && (
            <SettingsPanel catalog={data.catalog} />
          )}
        </PageTransition>
      </div>
    </main>
  );
}
