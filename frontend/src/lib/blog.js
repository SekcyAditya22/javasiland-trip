export const blogTitle = (post, lang) =>
  lang === "en" ? post.enTitle || post.title : post.title;
export const blogExcerpt = (post, lang) =>
  lang === "en" ? post.enExcerpt || post.excerpt : post.excerpt;
export const blogDate = (value, lang = "id") =>
  value
    ? new Date(value).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
export const blogSlug = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160)
    .replace(/-+$/, "");
export const dateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export const emptyBlogPost = () => ({
  title: "",
  enTitle: "",
  slug: "",
  excerpt: "",
  enExcerpt: "",
  content: "",
  enContent: "",
  image: "",
  gallery: [],
  imageSettings: { ratio: "16/9", items: [] },
  category: "Inspirasi",
  author: "Java Island Trip",
  status: "DRAFT",
  publishedAt: "",
});
export const blogStatus = (post) =>
  post.status === "DRAFT"
    ? "Draft"
    : new Date(post.publishedAt) > new Date()
      ? "Dijadwalkan"
      : "Tampil";
