import { useCallback } from "react";
import { api } from "../../lib/api";
import useRemoteData from "../../hooks/useRemoteData";
import PageLoading from "../PageLoading";
import CatalogHomepageSettings from "./CatalogHomepageSettings";

export default function CatalogHomepagePanel({ kind, items, setNotice }) {
  const request = useCallback(
    (signal) => api.catalogHomepageSettings(kind, { signal }),
    [kind],
  );
  const { data, loading, error, retry } = useRemoteData(request);
  if (loading) return <PageLoading compact />;
  if (error)
    return (
      <div className="empty-cell" role="alert">
        <p>Pengaturan homepage belum dapat dimuat.</p>
        <button className="button" onClick={retry}>
          Coba kembali
        </button>
      </div>
    );
  return (
    <CatalogHomepageSettings
      key={JSON.stringify(data)}
      settings={data}
      items={items}
      onError={(error) => setNotice(error.message, "error")}
      onSave={async (form) => {
        await api.saveCatalogHomepageSettings(kind, form);
        setNotice("Tampilan homepage berhasil disimpan.");
        retry();
      }}
    />
  );
}
