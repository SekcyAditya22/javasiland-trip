import { Link } from "react-router-dom";
import { TrendingUp, Eye, ArrowUpRight } from "lucide-react";
import SmartImage from "../SmartImage";
import { blogTitle } from "../../lib/blog";
import { imageFrameStyle } from "../../lib/media";

export default function PopularBlog({ posts = [], lang }) {
  if (!posts.length) return null;
  const en = lang === "en";
  return (
    <aside
      className="popular-blog"
      aria-label={en ? "Popular stories" : "Blog populer"}
    >
      <div className="popular-blog-heading">
        <TrendingUp size={19} />
        <div>
          <p className="section-kicker">READERS' PICKS</p>
          <h2>{en ? "Popular stories" : "Blog populer"}</h2>
        </div>
      </div>
      <ol>
        {posts.map((post, index) => (
          <li key={post.id}>
            <Link to={`/blog/${post.slug}`}>
              <div className="popular-blog-image">
                <SmartImage
                  src={post.image}
                  alt=""
                  width={160}
                  responsive={false}
                  lang={lang}
                  imageStyle={imageFrameStyle(post.imageSettings, post.image)}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <small>{post.category}</small>
                <h3>{blogTitle(post, lang)}</h3>
                <span className="popular-blog-views">
                  <Eye size={12} />{" "}
                  {post.views.toLocaleString(en ? "en-GB" : "id-ID")}{" "}
                  {en ? "reads" : "dibaca"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <Link className="popular-blog-all" to="/blog?sort=popular">
        {en ? "Explore more stories" : "Jelajahi cerita lainnya"}
        <ArrowUpRight size={15} />
      </Link>
    </aside>
  );
}
