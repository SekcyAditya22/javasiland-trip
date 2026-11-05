import AddButton from "../../components/admin/AddButton";
import { useState } from "react";
import { Edit3, Save, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import {
  ConfirmDeleteModal,
  EditorCard,
  ImageInput,
} from "../../components/admin/AdminFormUI";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";

const emptyPromo = {
  title: "",
  enTitle: "",
  discountType: "percent",
  discountValue: 0,
  startsOn: "",
  endsOn: "",
  image: "",
  active: true,
};
const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const saveImage = async (file, current) =>
  file
    ? (
        await api.uploadImage({
          dataUrl: await readDataUrl(file),
          filename: file.name,
        })
      ).url
    : current;

export default function PromoCrudPanel({ promos, onRefresh, setNotice }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPromo);
  const [file, setFile] = useState(null);
  const deletion = useDeleteConfirmation({
    deleteItem: (item) => api.deletePromo(item.id),
    onDeleted: async () => {
      setNotice("Promo berhasil dihapus.");
      await onRefresh();
    },
    onError: (error) => setNotice(error.message, "error"),
  });
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const open = (item) => {
    setEditing(item?.id || "new");
    setForm(
      item
        ? {
            ...emptyPromo,
            ...item,
            discountType: item.discount_type || item.discountType,
            discountValue: item.discount_value || item.discountValue,
            startsOn: item.starts_on || item.startsOn || "",
            endsOn: item.ends_on || item.endsOn || "",
          }
        : emptyPromo,
    );
    setFile(null);
  };
  const save = async (event) => {
    event.preventDefault();
    try {
      const image = await saveImage(file, form.image);
      const payload = {
        ...form,
        image,
        discountValue: Number(form.discountValue),
      };
      if (editing === "new") await api.createPromo(payload);
      else await api.updatePromo(editing, payload);
      setNotice("Promo berhasil disimpan.");
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
        itemType="promo"
        itemName={deletion.target?.title}
        deleting={deletion.deleting}
        onClose={deletion.cancelDelete}
        onConfirm={deletion.confirmDelete}
      />
      <div className="section-head">
        <div>
          <p className="section-kicker">PROMO CRUD</p>
          <h2>Promo</h2>
          <p>Promo aktif dapat ditampilkan di landing page.</p>
        </div>
        <AddButton onClick={() => open()}>Promo baru</AddButton>
      </div>
      {editing && (
        <EditorCard
          title={editing === "new" ? "Tambah promo" : "Edit promo"}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form" onSubmit={save}>
            <div className="admin-form-grid">
              <label className="field">
                Nama promo
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Nama English
                <input
                  value={form.enTitle}
                  onChange={(e) => update("enTitle", e.target.value)}
                />
              </label>
              <label className="field">
                Tipe diskon
                <select
                  value={form.discountType}
                  onChange={(e) => update("discountType", e.target.value)}
                >
                  <option value="percent">Persen</option>
                  <option value="nominal">Nominal</option>
                </select>
              </label>
              <label className="field">
                Nilai diskon
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => update("discountValue", e.target.value)}
                />
              </label>
              <label className="field">
                Mulai
                <input
                  type="date"
                  value={form.startsOn}
                  onChange={(e) => update("startsOn", e.target.value)}
                />
              </label>
              <label className="field">
                Selesai
                <input
                  type="date"
                  value={form.endsOn}
                  onChange={(e) => update("endsOn", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={form.active ? "true" : "false"}
                  onChange={(e) => update("active", e.target.value === "true")}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Draft</option>
                </select>
              </label>
              <div className="field full">
                <ImageInput
                  value={form.image}
                  onChange={(value) => update("image", value)}
                  onFile={setFile}
                />
              </div>
            </div>
            <button className="button" type="submit">
              <Save size={15} /> Simpan promo
            </button>
          </form>
        </EditorCard>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Promo</th>
              <th>Diskon</th>
              <th>Periode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                </td>
                <td>
                  {item.discount_type === "percent"
                    ? `${item.discount_value}%`
                    : item.discount_value}
                </td>
                <td>
                  {item.starts_on || "-"} s/d {item.ends_on || "-"}
                </td>
                <td>
                  <span className={item.active ? "status ok" : "status"}>
                    {item.active ? "Aktif" : "Draft"}
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
            {promos.length === 0 && (
              <tr>
                <td className="empty-cell" colSpan="5">
                  Belum ada promo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
