import AddButton from "../../components/admin/AddButton";
import { useState } from "react";
import { Edit3, Save, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import {
  ConfirmDeleteModal,
  EditorCard,
} from "../../components/admin/AdminFormUI";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import ImageGalleryInput from "../../components/admin/ImageGalleryInput";
import SmartImage from "../../components/SmartImage";
import CatalogContentTabs from "../../components/admin/CatalogContentTabs";
import CatalogHomepagePanel from "../../components/admin/CatalogHomepagePanel";

const emptyFleet = {
  name: "",
  type: "",
  capacity: 4,
  transmission: "Automatic",
  from: 0,
  image: "",
  gallery: [],
  specs: "",
  rates: [
    { serviceType: "driver_only", price: 0 },
    { serviceType: "driver_fuel", price: 0 },
    { serviceType: "all_in", price: 0 },
  ],
};
const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function FleetCrudPanel({ fleet, onRefresh, setNotice }) {
  const [tab, setTab] = useState("items");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFleet);
  const [imageBusy, setImageBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const deletion = useDeleteConfirmation({
    deleteItem: (item) => api.deleteFleet(item.id),
    onDeleted: async () => {
      setNotice("Armada berhasil dihapus.");
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
            ...emptyFleet,
            ...item,
            specs: (item.specs || []).join(", "),
            rates: item.rates || emptyFleet.rates,
          }
        : emptyFleet,
    );
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving || imageBusy) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        from: Number(form.from),
        specs: String(form.specs)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        rates: form.rates.map((rate) => ({
          ...rate,
          price: Number(rate.price),
        })),
      };
      if (editing === "new") await api.createFleet(payload);
      else await api.updateFleet(editing, payload);
      setNotice("Armada berhasil disimpan.");
      setEditing(null);
      await onRefresh();
    } catch (error) {
      setNotice(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="admin-card">
      <ConfirmDeleteModal
        open={Boolean(deletion.target)}
        itemType="unit armada"
        itemName={deletion.target?.name}
        deleting={deletion.deleting}
        onClose={deletion.cancelDelete}
        onConfirm={deletion.confirmDelete}
      />
      <div className="section-head">
        <div>
          <p className="section-kicker">FLEET CRUD</p>
          <h2>Unit Armada</h2>
          <p>
            Kelola kendaraan, tarif, dan gambar armada untuk halaman rental.
          </p>
        </div>
        <AddButton onClick={() => open()}>Unit baru</AddButton>
      </div>
      <CatalogContentTabs tab={tab} onChange={setTab} label="armada" />
      {editing && (
        <EditorCard
          title={editing === "new" ? "Tambah unit" : "Edit unit"}
          onClose={() => {
            if (!saving && !imageBusy) setEditing(null);
          }}
        >
          <form className="admin-form" onSubmit={save}>
            <div className="admin-form-grid">
              <label className="field">
                Nama unit
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Tipe
                <input
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                />
              </label>
              <label className="field">
                Kapasitas
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => update("capacity", e.target.value)}
                />
              </label>
              <label className="field">
                Transmisi
                <input
                  value={form.transmission}
                  onChange={(e) => update("transmission", e.target.value)}
                />
              </label>
              <label className="field">
                Harga mulai
                <input
                  type="number"
                  min="0"
                  value={form.from}
                  onChange={(e) => update("from", e.target.value)}
                />
              </label>
              <label className="field">
                Status
                <select
                  value={form.status || "idle"}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="idle">Aktif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
              <label className="field full">
                Spesifikasi
                <input
                  value={form.specs}
                  onChange={(e) => update("specs", e.target.value)}
                  placeholder="6 seats, Automatic, AC"
                />
              </label>
              <div className="field full">
                <ImageGalleryInput
                  image={form.image}
                  gallery={form.gallery}
                  onChange={(images) =>
                    setForm((current) => ({ ...current, ...images }))
                  }
                  onBusyChange={setImageBusy}
                  disabled={saving}
                />
              </div>
            </div>
            <button
              className="button"
              type="submit"
              disabled={saving || imageBusy}
            >
              <Save size={15} />{" "}
              {imageBusy
                ? "Mengunggah gambar…"
                : saving
                  ? "Menyimpan…"
                  : "Simpan armada"}
            </button>
          </form>
        </EditorCard>
      )}
      {tab === "homepage" ? (
        <CatalogHomepagePanel
          kind="fleet"
          items={fleet}
          setNotice={setNotice}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Unit</th>
                <th>Kapasitas</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="table-image">
                      {item.image && (
                        <SmartImage
                          src={item.image}
                          alt=""
                          width={160}
                          responsive={false}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>{item.type}</small>
                  </td>
                  <td>{item.capacity} pax</td>
                  <td>{money(item.from)}</td>
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
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
