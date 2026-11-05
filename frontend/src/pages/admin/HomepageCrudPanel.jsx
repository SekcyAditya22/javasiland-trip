import { useState } from "react";
import { Edit3 } from "lucide-react";
import { api } from "../../lib/api";
import { imageList } from "../../lib/images";
import HomepageEditor from "../../components/admin/HomepageEditor";

export default function HomepageCrudPanel({ sections, onRefresh, setNotice }) {
  const [editing, setEditing] = useState(null);
  const save = async (form) => {
    try {
      await api.updateHomepage(editing.sectionKey, form);
      setNotice("Konten homepage berhasil disimpan.");
      setEditing(null);
      await onRefresh();
    } catch (error) {
      setNotice(error.message, "error");
      throw error;
    }
  };
  return (
    <section className="admin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">CONTENT CRUD</p>
          <h2>Konten Homepage</h2>
          <p>
            Kelola teks, galeri, sampul, dan carousel yang tampil di landing
            page.
          </p>
        </div>
      </div>
      {editing && (
        <HomepageEditor
          key={editing.sectionKey}
          section={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Judul</th>
              <th>Galeri</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((item) => (
              <tr key={item.sectionKey}>
                <td>{item.sectionKey}</td>
                <td>{item.title}</td>
                <td>{imageList(item.image, item.gallery).length} gambar</td>
                <td>
                  <span className={item.visible ? "status ok" : "status"}>
                    {item.visible ? "Tampil" : "Sembunyi"}
                  </span>
                </td>
                <td>
                  <button
                    className="icon-btn"
                    onClick={() => setEditing(item)}
                    aria-label={`Edit section ${item.sectionKey}`}
                  >
                    <Edit3 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
