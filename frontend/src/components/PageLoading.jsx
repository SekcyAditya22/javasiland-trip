export default function PageLoading({
  lang = "id",
  detail = false,
  compact = false,
}) {
  return (
    <div
      className={`page-loading ${compact ? "compact" : ""}`}
      aria-busy="true"
    >
      <p className="loading-caption" role="status">
        <span className="loading-mark" aria-hidden="true">
          JI
        </span>
        {lang === "en"
          ? "Getting everything ready for you…"
          : "Sebentar, kami sedang menyiapkan halaman…"}
      </p>
      <div
        className={detail ? "loading-detail" : "loading-catalog"}
        aria-hidden="true"
      >
        {detail ? (
          <>
            <div className="skeleton skeleton-picture" />
            <div className="loading-copy">
              <div className="skeleton skeleton-kicker" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-action" />
            </div>
          </>
        ) : (
          <>
            <div className="loading-heading">
              <div className="skeleton skeleton-kicker" />
              <div className="skeleton skeleton-title" />
            </div>
            <div className="loading-card-grid">
              {[0, 1, 2].map((key) => (
                <div className="loading-card" key={key}>
                  <div className="skeleton skeleton-picture" />
                  <div className="loading-copy">
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-action" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
