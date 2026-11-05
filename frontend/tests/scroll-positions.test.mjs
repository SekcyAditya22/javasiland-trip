import test from "node:test";
import assert from "node:assert/strict";

const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
globalThis.window = {
  location: { origin: "http://localhost:4172" },
  setTimeout,
  clearTimeout,
};
const freshStore = () =>
  import(`../src/lib/scrollPositions.js?test=${Math.random()}`);
const location = (key, pathname = "/rental", search = "", hash = "") => ({
  key,
  pathname,
  search,
  hash,
});

test("separate history entries and queries retain independent scroll positions", async () => {
  storage.clear();
  const store = await freshStore();
  const first = location("first");
  const second = location("second");
  const filtered = location("filter", "/packages", "?filter=Jogja");
  store.rememberScrollPosition(first, { x: 0, y: 1200 });
  store.rememberScrollPosition(second, { x: 0, y: 400 });
  store.rememberScrollPosition(filtered, { x: 0, y: 650 });
  assert.equal(store.savedScrollPosition(first).y, 1200);
  assert.equal(store.savedScrollPosition(second).y, 400);
  assert.equal(store.savedScrollPosition(filtered).y, 650);
  assert.equal(store.savedScrollPosition(location("new")), undefined);
  assert.equal(
    store.savedScrollPosition(location("filter", "/packages")),
    undefined,
  );
  assert.deepEqual(store.returnNavigation("/packages"), {
    to: "/packages?filter=Jogja",
    position: { x: 0, y: 650 },
  });
  store.flushScrollPositions();
});

test("explicit booking queries are preserved while recovering the detail scroll", async () => {
  storage.clear();
  const store = await freshStore();
  store.rememberScrollPosition(location("detail", "/packages/dieng"), {
    x: 0,
    y: 900,
  });
  assert.deepEqual(store.returnNavigation("/packages/dieng?variant=3"), {
    to: "/packages/dieng?variant=3",
    position: { x: 0, y: 900 },
  });
  assert.deepEqual(store.returnNavigation("/malaysia"), {
    to: "/malaysia",
    position: null,
  });
  store.flushScrollPositions();
});

test("session persistence survives reload and keeps only the latest 80 entries", async () => {
  storage.clear();
  const store = await freshStore();
  for (let i = 0; i < 85; i++)
    store.rememberScrollPosition(location(`visit-${i}`), { x: 0, y: i * 100 });
  store.flushScrollPositions();
  const reloaded = await freshStore();
  assert.equal(reloaded.savedScrollPosition(location("visit-0")), undefined);
  assert.equal(reloaded.savedScrollPosition(location("visit-84")).y, 8400);
  assert.equal(JSON.parse([...storage.values()][0]).length, 80);
});

test("malformed storage and unavailable browser storage do not break navigation", async () => {
  storage.clear();
  storage.set("jit:scroll-positions:v1", "invalid JSON");
  const store = await freshStore();
  assert.equal(store.savedScrollPosition(location("none")), undefined);
  store.rememberScrollPosition(location("invalid"), { x: 0, y: NaN });
  assert.equal(store.savedScrollPosition(location("invalid")), undefined);
  const original = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem() {
      throw new Error("Storage disabled");
    },
    setItem() {
      throw new Error("Storage disabled");
    },
  };
  try {
    const memoryOnly = await freshStore();
    memoryOnly.rememberScrollPosition(location("memory"), { x: 0, y: 700 });
    memoryOnly.flushScrollPositions();
    assert.equal(memoryOnly.savedScrollPosition(location("memory")).y, 700);
  } finally {
    globalThis.sessionStorage = original;
  }
});
