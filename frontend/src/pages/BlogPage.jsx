import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, BookOpen } from "lucide-react";
import { api } from "../lib/api";
import useRemoteData from "../hooks/useRemoteData";
import PageHero from "../components/PageHero";
import PageLoading from "../components/PageLoading";
import CatalogError from "../components/CatalogError";
import BlogCard from "../components/blog/BlogCard";
import ScrollReveal from "../components/ScrollReveal";
import BackLink from "../components/BackLink";

export default function BlogPage({ lang }) {
  const en = lang === "en";
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") === "popular" ? "popular" : "latest";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [query, setQuery] = useState(q);
  useEffect(() => setQuery(q), [q]);
  const request = useCallback(
    (signal) => api.blogList({ q, category, sort, page }, { signal }),
    [q, category, sort, page],
  );
  const { data, loading, error, retry } = useRemoteData(request);
  const change = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([key, value]) =>
      value ? next.set(key, String(value)) : next.delete(key),
    );
    setParams(next);
  };
  if (error && !loading) return <CatalogError lang={lang} retry={retry} />;
  return (
    <main>
      <PageHero
        kicker="JAVA ISLAND JOURNAL"
        title={
          en
            ? "Stories worth taking with you."
            : "Cerita yang ikut dalam perjalanan."
        }
        desc={
          en
            ? "Destination guides, thoughtful tips, and inspiration from people who know the road."
            : "Panduan destinasi, tips perjalanan, dan inspirasi dari mereka yang mengenal setiap sudutnya."
        }
        back={
          <BackLink className="back-link" to="/">
            <ChevronLeft size={16} />
            {en ? "Back to home" : "Kembali ke beranda"}
          </BackLink>
        }
      />
      <ScrollReveal as="section" className="section blog-list-section">
        <div className="blog-filter-bar">
          <form
            className="blog-search"
            onSubmit={(event) => {
              event.preventDefault();
              change({ q: query.trim() });
            }}
          >
            <Search size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                en
                  ? "Find your next inspiration…"
                  : "Cari inspirasi perjalanan…"
              }
              aria-label={en ? "Search articles" : "Cari artikel"}
              maxLength={100}
            />
            <button type="submit">{en ? "Search" : "Cari"}</button>
          </form>
          <label className="field blog-sort">
            {en ? "Sort by" : "Urutkan"}
            <select
              value={sort}
              onChange={(event) => change({ sort: event.target.value })}
            >
              <option value="latest">
                {en ? "Latest stories" : "Artikel terbaru"}
              </option>
              <option value="popular">
                {en ? "Most read" : "Paling banyak dibaca"}
              </option>
            </select>
          </label>
        </div>
        <div className="filter-row blog-categories">
          <button
            className={`filter-chip ${!category ? "active" : ""}`}
            onClick={() => change({ category: "" })}
          >
            {en ? "All stories" : "Semua cerita"}
          </button>
          {(data?.categories || []).map((entry) => (
            <button
              key={entry}
              className={`filter-chip ${category === entry ? "active" : ""}`}
              onClick={() => change({ category: entry })}
            >
              {entry}
            </button>
          ))}
        </div>
        {loading ? (
          <PageLoading lang={lang} compact />
        ) : (
          <>
            {data.posts.length ? (
              <div className="blog-grid">
                {data.posts.map((post, index) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    lang={lang}
                    priority={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="blog-empty">
                <BookOpen size={32} />
                <h2>
                  {en
                    ? "A new story is on its way."
                    : "Cerita baru sedang disiapkan."}
                </h2>
                <p>
                  {q || category
                    ? en
                      ? "No articles match this search. Try another keyword."
                      : "Belum ada artikel yang sesuai. Coba kata kunci lainnya."
                    : en
                      ? "Come back soon for more travel inspiration."
                      : "Kembali lagi untuk menemukan inspirasi perjalanan berikutnya."}
                </p>
                {(q || category) && (
                  <button
                    className="button button-outline"
                    onClick={() => setParams({})}
                  >
                    {en ? "Clear filters" : "Hapus filter"}
                  </button>
                )}
              </div>
            )}
            {data.pageCount > 1 && (
              <nav
                className="blog-pagination"
                aria-label={en ? "Article pages" : "Halaman artikel"}
              >
                <button
                  className="small-btn"
                  disabled={page <= 1}
                  onClick={() => change({ page: page - 1 })}
                >
                  <ChevronLeft size={16} />
                  {en ? "Previous" : "Sebelumnya"}
                </button>
                <span>
                  {page} / {data.pageCount}
                </span>
                <button
                  className="small-btn"
                  disabled={page >= data.pageCount}
                  onClick={() => change({ page: page + 1 })}
                >
                  {en ? "Next" : "Berikutnya"}
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </>
        )}
      </ScrollReveal>
    </main>
  );
}
