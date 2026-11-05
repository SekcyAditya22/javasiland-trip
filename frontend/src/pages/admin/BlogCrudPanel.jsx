import { useCallback, useState } from "react";
import { Edit3, ExternalLink, FileText, Settings2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { blogDate, blogStatus } from "../../lib/blog";
import useRemoteData from "../../hooks/useRemoteData";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import AddButton from "../../components/admin/AddButton";
import { ConfirmDeleteModal } from "../../components/admin/AdminFormUI";
import BlogEditor from "../../components/admin/BlogEditor";
import BlogHomepageSettings from "../../components/admin/BlogHomepageSettings";
import PageLoading from "../../components/PageLoading";
import SmartImage from "../../components/SmartImage";

export default function BlogCrudPanel({ setNotice, refreshKey }) {
  const request = useCallback(
    (signal) => api.adminBlog({ signal }),
    [refreshKey],
  );
  const { data, loading, error, retry } = useRemoteData(request);
  const [tab, setTab] = useState("posts");
  const [editing, setEditing] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const report = (error) =>
    setNotice(error.message || "Perubahan blog belum dapat disimpan.", "error");
  const deletion = useDeleteConfirmation({
    deleteItem: (post) => api.deleteBlogPost(post.id),
    onDeleted: () => {
      setNotice("Artikel berhasil dihapus.");
      retry();
    },
    onError: report,
  });
  const open = async (post) => {
    if (!post) {
      setEditing({ isNew: true });
      return;
    }
    setOpeningId(post.id);
    try {
      setEditing(await api.adminBlogPost(post.id));
    } catch (error) {
      report(error);
    } finally {
      setOpeningId(null);
    }
  };
  const save = async (form) => {
    if (editing.isNew) await api.createBlogPost(form);
    else await api.updateBlogPost(editing.id, form);
    setNotice("Artikel berhasil disimpan.");
    setEditing(null);
    retry();
  };
  const posts = (data?.posts || []).filter(
    (post) =>
      (status === "all" || post.status === status) &&
      `${post.title} ${post.category} ${post.author}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="admin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">JAVA ISLAND JOURNAL</p>
          <h2>Blog & cerita perjalanan</h2>
          <p>
            Kelola artikel, gambar, publikasi, dan pilihan cerita di homepage.
          </p>
        </div>
        <AddButton onClick={() => open()}>Artikel baru</AddButton>
      </div>
      <div className="blog-admin-tabs">
        <button
          type="button"
          className={tab === "posts" ? "active" : ""}
          onClick={() => setTab("posts")}
        >
          <FileText size={16} />
          Artikel
        </button>
        <button
          type="button"
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}
        >
          <Settings2 size={16} />
          Tampilan homepage
        </button>
      </div>
      {loading ? (
        <PageLoading compact />
      ) : error ? (
        <div className="empty-cell" role="alert">
          <p>Blog belum dapat dimuat.</p>
          <button className="button" onClick={retry}>
            Coba kembali
          </button>
        </div>
      ) : tab === "settings" ? (
        <BlogHomepageSettings
          key={JSON.stringify(data.settings)}
          settings={data.settings}
          posts={data.posts}
          onError={report}
          onSave={async (form) => {
            await api.saveBlogSettings(form);
            setNotice("Pengaturan blog berhasil disimpan.");
            retry();
          }}
        />
      ) : (
        <>
          <div className="blog-admin-filters">
            <label className="field">
              Cari artikel
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Judul, kategori, atau penulis"
              />
            </label>
            <label className="field">
              Status artikel
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Semua status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Publikasi & jadwal</option>
              </select>
            </label>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Dibaca</th>
                  <th>Publikasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {posts.length ? (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="blog-admin-title">
                          <div className="table-image">
                            <SmartImage
                              src={post.image}
                              alt=""
                              width={160}
                              responsive={false}
                            />
                          </div>
                          <span>
                            <strong>{post.title}</strong>
                            <small>{post.author}</small>
                          </span>
                        </div>
                      </td>
                      <td>{post.category}</td>
                      <td>
                        <span
                          className={
                            blogStatus(post) === "Tampil"
                              ? "status ok"
                              : "status"
                          }
                        >
                          {blogStatus(post)}
                        </span>
                      </td>
                      <td>{post.views.toLocaleString("id-ID")}</td>
                      <td>{blogDate(post.publishedAt)}</td>
                      <td>
                        <button
                          className="icon-btn"
                          disabled={openingId !== null}
                          onClick={() => open(post)}
                          aria-label={`Edit ${post.title}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        {blogStatus(post) === "Tampil" && (
                          <Link
                            className="icon-btn"
                            to={`/blog/${post.slug}`}
                            target="_blank"
                            aria-label={`Lihat ${post.title}`}
                          >
                            <ExternalLink size={16} />
                          </Link>
                        )}
                        <button
                          className="icon-btn danger"
                          onClick={() => deletion.requestDelete(post)}
                          aria-label={`Hapus ${post.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                        {openingId === post.id && <small>Memuat…</small>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-cell" colSpan={6}>
                      Belum ada artikel yang sesuai. Klik Artikel baru untuk
                      memulai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {editing && (
        <BlogEditor
          key={editing.id || "new"}
          post={editing.isNew ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onError={report}
        />
      )}
      <ConfirmDeleteModal
        open={Boolean(deletion.target)}
        itemType="artikel"
        itemName={deletion.target?.title}
        description="akan dihapus bersama data pembacanya dan dikeluarkan dari pilihan homepage."
        deleting={deletion.deleting}
        onConfirm={deletion.confirmDelete}
        onClose={deletion.cancelDelete}
      />
    </section>
  );
}
