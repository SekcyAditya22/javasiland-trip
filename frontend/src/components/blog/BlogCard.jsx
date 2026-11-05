import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3 } from "lucide-react";
import ImageCarousel from "../ImageCarousel";
import { imageList } from "../../lib/images";
import { blogDate, blogExcerpt, blogTitle } from "../../lib/blog";

export default function BlogCard({ post, lang, priority = false }) {
  const title = blogTitle(post, lang);
  return (
    <article className="blog-card">
      <div className="blog-card-cover">
        <ImageCarousel
          images={imageList(post.image, post.gallery)}
          title={title}
          href={`/blog/${post.slug}`}
          lang={lang}
          priority={priority}
          imageSettings={post.imageSettings}
          badge={<span className="blog-category-pill">{post.category}</span>}
        />
      </div>
      <div className="blog-card-body">
        <div className="blog-card-meta">
          <span>{blogDate(post.publishedAt, lang)}</span>
          <span>
            <Clock3 size={13} />
            {post.readingMinutes} {lang === "en" ? "min read" : "menit baca"}
          </span>
        </div>
        <h3>
          <Link to={`/blog/${post.slug}`}>{title}</Link>
        </h3>
        <p>{blogExcerpt(post, lang)}</p>
        <Link className="blog-read-more" to={`/blog/${post.slug}`}>
          {lang === "en" ? "Read the story" : "Baca ceritanya"}
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
