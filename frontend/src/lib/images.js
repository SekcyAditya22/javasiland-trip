import { resolveApiUrl, runtimeConfig } from "../config/runtime";

export const imageSrc = (value) => {
  if (value?.startsWith("/uploads/")) return resolveApiUrl(value);
  // Uploaded URLs use the public backend domain in stored catalog data. When
  // browsing locally, load those same files through the configured local API.
  if (
    (runtimeConfig.useProxy ||
      runtimeConfig.apiUrl === runtimeConfig.localApiUrl) &&
    runtimeConfig.publicApiUrl
  ) {
    try {
      const url = new URL(value);
      if (
        url.origin === new URL(runtimeConfig.publicApiUrl).origin &&
        url.pathname.startsWith("/uploads/")
      )
        return resolveApiUrl(url.pathname);
    } catch {
      /* Other image sources remain unchanged. */
    }
  }
  return value;
};

export const imageList = (...sources) => [
  ...new Set(
    sources
      .flat(Infinity)
      .filter((image) => typeof image === "string" && image.trim())
      .map((image) => image.trim()),
  ),
];

const isResizable = (value) => {
  try {
    return new URL(value).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
};

export const imageUrl = (value, width = 720) => {
  const resolved = imageSrc(value);
  if (!isResizable(resolved)) return resolved;
  const url = new URL(resolved);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", "75");
  return url.href;
};

export const imageSrcSet = (value, widths = [360, 640, 960, 1440]) =>
  isResizable(value)
    ? widths.map((width) => `${imageUrl(value, width)} ${width}w`).join(", ")
    : undefined;

export const packageImages = (item) =>
  imageList(
    item?.image,
    item?.gallery,
    item?.variantDetails?.flatMap((variant) => [
      variant.heroImage,
      ...(variant.gallery || []),
    ]),
  );

export const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
