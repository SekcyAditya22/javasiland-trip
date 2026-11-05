import { useCallback, useEffect, useState } from "react";
import { Edit3, Save, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddButton from "../../components/admin/AddButton";
import {
  ConfirmDeleteModal,
  EditorCard,
} from "../../components/admin/AdminFormUI";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import { api } from "../../lib/api";

const emptyForm = () => ({
  username: "",
  password: "",
  role: "ADMIN",
  active: true,
});

export default function UsersCrudPanel({ currentUser, setNotice }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setUsers(await api.users());
    } catch (error) {
      if (error.status === 401) navigate("/login-admin", { replace: true });
      else setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    void load();
  }, [load]);
  const deletion = useDeleteConfirmation({
    deleteItem: (user) => api.deleteUser(user.id),
    onDeleted: async () => {
      setNotice("Pengguna berhasil dihapus.");
      await load();
    },
    onError: (error) => setNotice(error.message, "error"),
  });
  const open = (user) => {
    setEditing(user?.id ?? "new");
    setForm(
      user
        ? {
            username: user.username,
            role: user.role,
            active: user.active,
            password: "",
          }
        : emptyForm(),
    );
    setError("");
  };
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (editing === "new") await api.createUser(form);
      else await api.updateUser(editing, form);
      if (editing === currentUser.id) {
        navigate("/login-admin", {
          replace: true,
          state: {
            message: "Akun berhasil diperbarui. Silakan masuk kembali.",
          },
        });
        return;
      }
      setEditing(null);
      setNotice("Pengguna berhasil disimpan.");
      await load();
    } catch (error) {
      setError(error.message);
      setNotice(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const self = editing === currentUser.id;

  return (
    <section className="admin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">AKSES DASHBOARD</p>
          <h2>Users</h2>
          <p>Kelola akun, hak akses, dan status pengguna admin.</p>
        </div>
        <AddButton onClick={() => open()}>Pengguna baru</AddButton>
      </div>
      <div className="admin-users-summary">
        <Users size={18} aria-hidden="true" />
        <span>
          Owner mengelola pengguna dan seluruh konten. Admin mengelola katalog,
          konten, dan booking.
        </span>
      </div>
      {loadError ? (
        <p role="alert" className="form-error">
          {loadError}{" "}
          <button className="small-btn" onClick={load}>
            Coba kembali
          </button>
        </p>
      ) : (
        <div className="admin-table-wrap" aria-busy={loading}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Hak akses</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    Memuat pengguna…
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.username}</strong>
                      {user.id === currentUser.id && (
                        <small className="user-self-label">Akun Anda</small>
                      )}
                    </td>
                    <td>{user.role === "OWNER" ? "Owner" : "Admin"}</td>
                    <td>
                      <span className={user.active ? "status ok" : "status"}>
                        {user.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        onClick={() => open(user)}
                        aria-label={`Edit ${user.username}`}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        disabled={user.id === currentUser.id}
                        onClick={() => deletion.requestDelete(user)}
                        aria-label={`Hapus ${user.username}`}
                        title={
                          user.id === currentUser.id
                            ? "Akun sendiri tidak dapat dihapus"
                            : "Hapus pengguna"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {editing !== null && (
        <EditorCard
          title={editing === "new" ? "Tambah pengguna" : "Edit pengguna"}
          onClose={() => !saving && setEditing(null)}
        >
          <form className="admin-form" onSubmit={save}>
            <div className="admin-form-grid">
              <label className="field">
                Username
                <input
                  value={form.username}
                  onChange={(event) => update("username", event.target.value)}
                  minLength={3}
                  maxLength={40}
                  pattern="[a-zA-Z0-9._\-]+"
                  autoComplete="off"
                  required
                />
              </label>
              <label className="field">
                {editing === "new" ? "Password" : "Password baru"}
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required={editing === "new"}
                />
                <small className="field-hint">
                  {editing === "new"
                    ? "Minimal 8 karakter."
                    : "Kosongkan untuk mempertahankan password."}
                </small>
              </label>
              <label className="field">
                Hak akses
                <select
                  value={form.role}
                  onChange={(event) => update("role", event.target.value)}
                  disabled={self}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>
              </label>
              <label className="field">
                Status
                <select
                  value={String(form.active)}
                  onChange={(event) =>
                    update("active", event.target.value === "true")
                  }
                  disabled={self}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </label>
            </div>
            <p className="field-hint">
              Perubahan akun mengakhiri sesi login pengguna tersebut.
              {self && " Anda akan diminta masuk kembali setelah menyimpan."}
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Menyimpan…" : "Simpan pengguna"}
            </button>
          </form>
        </EditorCard>
      )}
      <ConfirmDeleteModal
        open={Boolean(deletion.target)}
        itemType="pengguna"
        description="akan dihapus. Akses dashboard dan seluruh sesi login akun ini akan dihentikan."
        itemName={deletion.target?.username}
        deleting={deletion.deleting}
        onConfirm={deletion.confirmDelete}
        onClose={deletion.cancelDelete}
      />
    </section>
  );
}
