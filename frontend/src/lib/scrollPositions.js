const STORAGE_KEY = "jit:scroll-positions:v1";
const MAX_ENTRIES = 80;
let positions;
let persistTimer;

export const routeUrl = ({ pathname, search = "", hash = "" }) =>
  `${pathname}${search}${hash}`;
const entryKey = (location) => `${location.key}:${routeUrl(location)}`;
export const isScrollPosition = (point) =>
  point &&
  [point.x, point.y].every((value) => Number.isFinite(value) && value >= 0);

function entries() {
  if (positions) return positions;
  positions = new Map();
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      saved.slice(-MAX_ENTRIES).forEach((entry) => {
        if (
          typeof entry?.key === "string" &&
          typeof entry.url === "string" &&
          entry.url.startsWith("/") &&
          !entry.url.startsWith("//") &&
          isScrollPosition(entry)
        )
          positions.set(entry.key, entry);
      });
    }
  } catch {
    // Browsers may disable session storage; in-memory restoration still works.
  }
  return positions;
}

export function flushScrollPositions() {
  window.clearTimeout(persistTimer);
  persistTimer = undefined;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...entries().values()]),
    );
  } catch {
    /* Storage limits must not interrupt navigation. */
  }
}

export function rememberScrollPosition(location, point) {
  if (!isScrollPosition(point)) return;
  const cache = entries();
  const key = entryKey(location);
  cache.delete(key);
  cache.set(key, { key, url: routeUrl(location), x: point.x, y: point.y });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
  if (!persistTimer)
    persistTimer = window.setTimeout(flushScrollPositions, 200);
}

export function savedScrollPosition(location) {
  return entries().get(entryKey(location));
}

// Explicit "Kembali" links also recover the last catalog query/filter. An
// explicit query (e.g. the selected booking variant) keeps its own destination.
export function returnNavigation(to) {
  const target = new URL(to, window.location.origin);
  const matches = [...entries().values()]
    .reverse()
    .filter(
      (entry) =>
        new URL(entry.url, window.location.origin).pathname === target.pathname,
    );
  const exact = matches.find(
    (entry) => entry.url === `${target.pathname}${target.search}${target.hash}`,
  );
  const saved = target.search || target.hash ? exact || matches[0] : matches[0];
  return {
    to: saved && !target.search && !target.hash ? saved.url : to,
    position: saved ? { x: saved.x, y: saved.y } : null,
  };
}
