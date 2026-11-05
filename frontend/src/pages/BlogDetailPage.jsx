import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, Clock3, Eye } from "lucide-react";
import { api } from "../lib/api";
import { blogTitle, blogExcerpt, blogDate } from "../lib/blog";
import useRemoteData from "../hooks/useRemoteData";
import useBlogView from "../hooks/useBlogView";
import PageLoading from "../components/PageLoading";
import CatalogError from "../components/CatalogError";
import ImageCarousel from "../components/ImageCarousel";
import PopularBlog from "../components/blog/PopularBlog";
import { imageList } from "../lib/images";
import { mediaRatio } from "../lib/media";
import ArticleContent from "../components/blog/ArticleContent";
import BlogCard from "../components/blog/BlogCard";
import NotFoundPage from "./NotFoundPage";
import ScrollReveal from "../components/ScrollReveal";
import BackLink from "../components/BackLink";

export default function BlogDetailPage({ lang }) {
  const { slug } = useParams();
  const request = useCallback(
    (signal) => api.blogPost(slug, { signal }),
    [slug],
  );
  const { data, loading, error, retry } = useRemoteData(request);
  const views = useBlogView(!loading && !error ? data?.post : null);
  if (loading)
    return (
      <main>
        <PageLoading detail lang={lang} />
      </main>
    );
  if (error?.status === 404) return <NotFoundPage lang={lang} />;
  if (error) return <CatalogError lang={lang} retry={retry} />;
  const { post, related, popular = [] } = data;
  const en = lang === "en";
  return (
    <main>
      <article className="blog-article">
        <BackLink className="back-link" to="/blog">
          <ChevronLeft size={16} />
          {en ? "Back to all stories" : "Kembali ke daftar cerita"}
        </BackLink>
        <header className="blog-article-heading">
          <span className="blog-category-label">{post.category}</span>
          <h1>{blogTitle(post, lang)}</h1>
          <p className="blog-article-lead">{blogExcerpt(post, lang)}</p>
          <div className="blog-article-meta">
            <span className="blog-author-mark" aria-hidden="true">
              {post.author.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{post.author}</strong>
              <small>{blogDate(post.publishedAt, lang)}</small>
            </span>
            <span>
              <Clock3 size={15} />
              {post.readingMinutes} {en ? "min read" : "menit baca"}
            </span>
            <span>
              <Eye size={15} />
              {views.toLocaleString(en ? "en-GB" : "id-ID")}{" "}
              {en ? "reads" : "dibaca"}
            </span>
          </div>
        </header>
        {imageList(post.image, post.gallery).length > 0 && (
          <div className="blog-article-cover">
            <ImageCarousel
              images={imageList(post.image, post.gallery)}
              title={blogTitle(post, lang)}
              detail
              lang={lang}
              imageSettings={post.imageSettings}
              aspectRatio={mediaRatio(post.imageSettings)}
            />
          </div>
        )}
        <div
          className={`blog-article-body ${popular.length ? "has-popular" : ""}`}
        >
          <div className="blog-reading-column">
            <ArticleContent
              content={en ? post.enContent || post.content : post.content}
              lang={lang}
            />
            <div className="blog-article-cta">
              <p className="section-kicker">YOUR NEXT CHAPTER</p>
              <h2>
                {en
                  ? "Make it your own journey."
                  : "Jadikan cerita ini perjalanan Anda."}
              </h2>
              <Link className="button" to="/packages">
                {en ? "Explore our trips" : "Jelajahi paket trip"}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <PopularBlog posts={popular} lang={lang} />
        </div>
      </article>
      {related.length > 0 && (
        <ScrollReveal as="section" className="section blog-related">
          <div className="section-head">
            <div>
              <p className="section-kicker">KEEP EXPLORING</p>
              <h2>
                {en
                  ? "Another story to discover."
                  : "Masih ada cerita lainnya."}
              </h2>
            </div>
          </div>
          <div className="blog-grid">
            {related.map((entry) => (
              <BlogCard key={entry.id} post={entry} lang={lang} />
            ))}
          </div>
        </ScrollReveal>
      )}
    </main>
  );
}
