const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const publicApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);
const useProxy = import.meta.env.VITE_USE_API_PROXY !== "false";
let localApiUrl = trimTrailingSlash(import.meta.env.VITE_LOCAL_API_URL);
const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Keep local login cookies on the same site when switching between localhost
// and 127.0.0.1. The API port still comes from the configured local API URL.
if (isLocalBrowser && localApiUrl) {
  const localUrl = new URL(localApiUrl);
  if (["localhost", "127.0.0.1"].includes(localUrl.hostname)) {
    localUrl.hostname = window.location.hostname;
    localApiUrl = trimTrailingSlash(localUrl.href);
  }
}

export const runtimeConfig = Object.freeze({
  apiUrl: useProxy
    ? ""
    : isLocalBrowser && localApiUrl
      ? localApiUrl
      : publicApiUrl,
  useProxy,
  publicApiUrl,
  localApiUrl,
  appUrl: trimTrailingSlash(import.meta.env.VITE_APP_URL),
});

export const resolveApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${runtimeConfig.apiUrl}${normalizedPath}`;
};
