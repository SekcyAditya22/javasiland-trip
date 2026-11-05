import { requestJson, readSession, loginWithRecovery } from "./request";

export const CATALOG_UPDATED_EVENT = "jit:catalog-updated";

const json = async (url, options = {}) => {
  const data = await requestJson(url, options);
  if (
    (url.startsWith("/api/admin/blog") ||
      url.startsWith("/api/admin/homepage") ||
      url.startsWith("/api/admin/catalog-homepage")) &&
    ["POST", "PUT", "DELETE"].includes(options.method)
  ) {
    window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
  }
  return data;
};

export const api = {
  catalog: (options) => json("/api/public/bootstrap", options),
  quote: (payload) =>
    json("/api/public/quote", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  inquiry: (payload) =>
    json("/api/public/inquiries", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: loginWithRecovery,
  logout: () => json("/api/auth/logout", { method: "POST" }),
  session: readSession,
  dashboard: () => json("/api/admin/dashboard"),
  blogList: (params, options) =>
    json(`/api/public/blog?${new URLSearchParams(params)}`, options),
  blogPost: (slug, options) =>
    json(`/api/public/blog/${encodeURIComponent(slug)}`, options),
  blogView: (slug, options) =>
    json(`/api/public/blog/${encodeURIComponent(slug)}/view`, {
      ...options,
      method: "POST",
      body: "{}",
    }),
  adminBlog: (options) => json("/api/admin/blog", options),
  adminBlogPost: (id) => json(`/api/admin/blog/${id}`),
  createBlogPost: (payload) =>
    json("/api/admin/blog", { method: "POST", body: JSON.stringify(payload) }),
  updateBlogPost: (id, payload) =>
    json(`/api/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteBlogPost: (id) => json(`/api/admin/blog/${id}`, { method: "DELETE" }),
  saveBlogSettings: (payload) =>
    json("/api/admin/blog/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  catalogHomepageSettings: (kind, options) =>
    json(`/api/admin/catalog-homepage/${encodeURIComponent(kind)}`, options),
  saveCatalogHomepageSettings: (kind, payload) =>
    json(`/api/admin/catalog-homepage/${encodeURIComponent(kind)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  users: () => json("/api/admin/users"),
  createUser: (payload) =>
    json("/api/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) =>
    json(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id) => json(`/api/admin/users/${id}`, { method: "DELETE" }),
  updateBooking: (id, status) =>
    json(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  uploadImage: (payload) =>
    json("/api/admin/uploads", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createPackage: (payload) =>
    json("/api/admin/packages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePackage: (id, payload) =>
    json(`/api/admin/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePackage: (id) =>
    json(`/api/admin/packages/${id}`, { method: "DELETE" }),
  createFleet: (payload) =>
    json("/api/admin/fleet", { method: "POST", body: JSON.stringify(payload) }),
  updateFleet: (id, payload) =>
    json(`/api/admin/fleet/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteFleet: (id) => json(`/api/admin/fleet/${id}`, { method: "DELETE" }),
  createPromo: (payload) =>
    json("/api/admin/promos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePromo: (id, payload) =>
    json(`/api/admin/promos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePromo: (id) => json(`/api/admin/promos/${id}`, { method: "DELETE" }),
  createFaq: (payload) =>
    json("/api/admin/faqs", { method: "POST", body: JSON.stringify(payload) }),
  updateFaq: (id, payload) =>
    json(`/api/admin/faqs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteFaq: (id) => json(`/api/admin/faqs/${id}`, { method: "DELETE" }),
  updateHomepage: (key, payload) =>
    json(`/api/admin/homepage/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
