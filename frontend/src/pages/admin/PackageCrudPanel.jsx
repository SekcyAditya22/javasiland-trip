import AddButton from "../../components/admin/AddButton";
import { useState } from "react";
import { Edit3, Save, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import {
  ConfirmDeleteModal,
  EditorCard,
} from "../../components/admin/AdminFormUI";
import PackageFormFields from "../../components/admin/PackageFormFields";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import SmartImage from "../../components/SmartImage";
import CatalogContentTabs from "../../components/admin/CatalogContentTabs";
import CatalogHomepagePanel from "../../components/admin/CatalogHomepagePanel";
import {
  createEmptyPackageForm,
  packageFormToPayload,
  packageToForm,
} from "../../lib/packageForm";

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function PackageCrudPanel({ packages, onRefresh, setNotice }) {
  const [tab, setTab] = useState("items");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createEmptyPackageForm);
  const [imageBusy, setImageBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const deletion = useDeleteConfirmation({
    deleteItem: (item) => api.deletePackage(item.id),
    onDeleted: async () => {
      setNotice("Paket berhasil dihapus.");
      await onRefresh();
    },
    onError: (error) => setNotice(error.message, "error"),
  });
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const open = (item) => {
    setEditing(item?.id || "new");
    setForm(packageToForm(item));
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving || imageBusy) return;
    setSaving(true);
    try {
      const payload = packageFormToPayload(form, form.image);
      if (editing === "new") await api.createPackage(payload);
      else await api.updatePackage(editing, payload);
      setNotice("Paket berhasil disimpan.");
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
        itemType="paket trip"
        itemName={deletion.target?.title}
        deleting={deletion.deleting}
        onClose={deletion.cancelDelete}
        onConfirm={deletion.confirmDelete}
      />
      <div className="section-head">
        <div>
          <p className="section-kicker">CATALOG CRUD</p>
          <h2>Paket Trip</h2>
          <p>
            Tambah, ubah, hapus paket, dan kelola gambar yang tampil di landing
            page.
          </p>
        </div>
        <AddButton onClick={() => open()}>Paket baru</AddButton>
      </div>
      <CatalogContentTabs tab={tab} onChange={setTab} label="paket" />
      {editing && (
        <EditorCard
          title={editing === "new" ? "Tambah paket" : "Edit paket"}
          onClose={() => {
            if (!saving && !imageBusy) setEditing(null);
          }}
        >
          <form className="admin-form" onSubmit={save}>
            <PackageFormFields
              form={form}
              update={update}
              onImagesChange={(images) =>
                setForm((current) => ({
                  ...current,
                  ...images,
                  variantDrafts: current.variantDrafts.map((variant) => ({
                    ...variant,
                    heroImage:
                      variant.heroImage === current.image
                        ? images.image
                        : variant.heroImage,
                  })),
                }))
              }
              onImageBusy={setImageBusy}
              disabled={saving}
            />
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
                  : "Simpan paket"}
            </button>
          </form>
        </EditorCard>
      )}
      {tab === "homepage" ? (
        <CatalogHomepagePanel
          kind="packages"
          items={packages}
          setNotice={setNotice}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Paket</th>
                <th>Area</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((item) => (
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
                    <strong>{item.title}</strong>
                    <br />
                    <small>{item.tag || "Paket aktif"}</small>
                  </td>
                  <td>{item.area}</td>
                  <td>{money(item.price)}</td>
                  <td>
                    <span
                      className={
                        item.status === "DRAFT" ? "status" : "status ok"
                      }
                    >
                      {item.status === "DRAFT" ? "Draft" : "Tampil"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => open(item)}
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => deletion.requestDelete(item)}
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td className="empty-cell" colSpan="6">
                    Belum ada paket trip.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
