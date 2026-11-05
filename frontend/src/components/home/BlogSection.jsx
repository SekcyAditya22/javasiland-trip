import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import BlogCard from "../blog/BlogCard";
import ScrollReveal from "../ScrollReveal";

export default function BlogSection({ blog, lang }) {
  if (!blog?.settings?.visible) return null;
  const { settings, posts } = blog;
  return (
    <ScrollReveal as="section" className="section blog-home-section" id="blog">
      <div className="section-head">
        <div>
          <p className="section-kicker">TRAVEL JOURNAL</p>
          <h2>
            {lang === "en"
              ? settings.enTitle || settings.title
              : settings.title}
          </h2>
          <p>
            {lang === "en"
              ? settings.enDescription || settings.description
              : settings.description}
          </p>
        </div>
        <Link className="link-arrow" to="/blog">
          {lang === "en" ? "All stories" : "Semua cerita"}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      {posts.length ? (
        <div className="blog-grid">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="blog-empty">
          <BookOpen size={28} />
          <p>
            {lang === "en"
              ? "Our next travel stories are on their way. Come back soon."
              : "Cerita perjalanan berikutnya sedang disiapkan. Nantikan inspirasi dari kami."}
          </p>
        </div>
      )}
    </ScrollReveal>
  );
}
