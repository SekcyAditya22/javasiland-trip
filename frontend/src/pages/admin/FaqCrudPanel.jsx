import AddButton from "../../components/admin/AddButton";
import { useState } from "react";
import { Edit3, Save, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import {
  ConfirmDeleteModal,
  EditorCard,
} from "../../components/admin/AdminFormUI";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";

const emptyFaq = {
  question: "",
  enQuestion: "",
  answer: "",
  enAnswer: "",
  category: "general",
  sortOrder: 1,
  published: true,
};

export default function FaqCrudPanel({ faqs, onRefresh, setNotice }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFaq);
  const deletion = useDeleteConfirmation({
    deleteItem: (item) => api.deleteFaq(item.id),
    onDeleted: async () => {
      setNotice("FAQ berhasil dihapus.");
      await onRefresh();
    },
    onError: (error) => setNotice(error.message, "error"),
  });
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const open = (item) => {
    setEditing(item?.id || "new");
    setForm(item ? { ...emptyFaq, ...item } : emptyFaq);
  };
  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      if (editing === "new") await api.createFaq(payload);
      else await api.updateFaq(editing, payload);
      setNotice("FAQ berhasil disimpan.");
      setEditing(null);
      await onRefresh();
    } catch (error) {
      setNotice(error.message, "error");
    }
  };
  return (
    <section className="admin-card">
      <ConfirmDeleteModal
        open={Boolean(deletion.target)}
        itemType="FAQ"
        itemName={deletion.target?.question}
        deleting={deletion.deleting}
        onClose={deletion.cancelDelete}
        onConfirm={deletion.confirmDelete}
      />
      <div className="section-head">
        <div>
          <p className="section-kicker">CONTENT CRUD</p>
          <h2>FAQ</h2>
          <p>
            FAQ draft tetap tersimpan di dashboard. Hanya status Tampil yang
            muncul di landing page.
          </p>
        </div>
        <AddButton onClick={() => open()}>FAQ baru</AddButton>
      </div>
      {editing && (
        <EditorCard
          title={editing === "new" ? "Tambah FAQ" : "Edit FAQ"}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form" onSubmit={save}>
            <div className="admin-form-grid">
              <label className="field full">
                Pertanyaan
                <input
                  value={form.question}
                  onChange={(e) => update("question", e.target.value)}
                  required
                />
              </label>
              <label className="field full">
                Pertanyaan English
                <input
                  value={form.enQuestion}
                  onChange={(e) => update("enQuestion", e.target.value)}
                />
              </label>
              <label className="field">
                Jawaban
                <textarea
                  rows="4"
                  value={form.answer}
                  onChange={(e) => update("answer", e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Jawaban English
                <textarea
                  rows="4"
                  value={form.enAnswer}
                  onChange={(e) => update("enAnswer", e.target.value)}
                />
              </label>
              <label className="field">
                Kategori
                <input
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                />
              </label>
              <label className="field">
                Urutan
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => update("sortOrder", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={form.published ? "true" : "false"}
                  onChange={(e) =>
                    update("published", e.target.value === "true")
                  }
                >
                  <option value="true">Tampil</option>
                  <option value="false">Draft</option>
                </select>
              </label>
            </div>
            <button className="button" type="submit">
              <Save size={15} /> Simpan FAQ
            </button>
          </form>
        </EditorCard>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pertanyaan</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((item) => (
              <tr key={item.id}>
                <td>{item.question}</td>
                <td>{item.category}</td>
                <td>
                  <span className={item.published ? "status ok" : "status"}>
                    {item.published ? "Tampil" : "Draft"}
                  </span>
                </td>
                <td>
                  <button className="icon-btn" onClick={() => open(item)}>
                    <Edit3 size={15} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => deletion.requestDelete(item)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {faqs.length === 0 && (
              <tr>
                <td className="empty-cell" colSpan="4">
                  Belum ada FAQ. Klik “FAQ baru” untuk menambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
