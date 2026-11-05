import { resolveApiUrl } from "../config/runtime";

export class ApiError extends Error {
  constructor(message, { status = 0, code = "", retryAfter = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}
let csrfToken = "";
let sessionRequest = null;
const safeMethods = ["GET", "HEAD", "OPTIONS"];
const recoverable = (error) =>
  ["NETWORK", "TIMEOUT", "SERVICE_UNAVAILABLE", "INVALID_RESPONSE"].includes(
    error.code,
  );
const pause = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Aborted", "AbortError"));
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(done, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });

async function send(url, { signal, timeoutMs = 9000, ...options }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(resolveApiUrl(url), {
      ...options,
      signal: controller.signal,
      credentials: "include",
      cache: "no-store",
    });
    const raw = response.status === 204 ? "" : await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      /* A proxy or firewall can return HTML instead of JSON. */
    }
    if (!response.ok) {
      const status = response.status;
      const code =
        data?.code ||
        (status >= 500
          ? "SERVICE_UNAVAILABLE"
          : status === 403 && !data
            ? "CONNECTION_BLOCKED"
            : "");
      const message =
        data?.message ||
        (status >= 500
          ? "Server sedang menyiapkan koneksi. Coba kembali sebentar lagi."
          : status === 403
            ? "Koneksi ditolak oleh pengaturan akses server. Muat ulang halaman, lalu coba kembali."
            : `Permintaan belum berhasil (${status}).`);
      throw new ApiError(message, {
        status,
        code,
        retryAfter:
          Number(response.headers.get("Retry-After")) || data?.retryAfter || 0,
      });
    }
    if (response.status !== 204 && (!data || typeof data !== "object"))
      throw new ApiError(
        "Respons server belum dapat dibaca. Coba kembali sebentar lagi.",
        { code: "INVALID_RESPONSE" },
      );
    return data;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      timedOut
        ? "Server membutuhkan waktu lebih lama. Periksa koneksi, lalu coba kembali."
        : "Koneksi ke server terputus. Periksa jaringan, lalu coba kembali.",
      { code: timedOut ? "TIMEOUT" : "NETWORK" },
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function readSession() {
  if (!sessionRequest)
    sessionRequest = requestJson("/api/auth/session").finally(() => {
      sessionRequest = null;
    });
  return sessionRequest;
}

export async function requestJson(url, { retryCsrf = true, ...options } = {}) {
  const method = (options.method || "GET").toUpperCase();
  const safe = safeMethods.includes(method);
  const protectedWrite =
    !safe && (url.startsWith("/api/admin/") || url === "/api/auth/logout");
  if (protectedWrite && !csrfToken && url !== "/api/auth/logout")
    await readSession();
  for (let attempt = 0; ; attempt++) {
    try {
      const headers = {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(!safe ? { "X-Requested-With": "JavaIslandTrip" } : {}),
        ...(protectedWrite && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...options.headers,
      };
      const data = await send(url, { ...options, method, headers });
      if (
        ["/api/auth/login", "/api/auth/session"].includes(url) &&
        /^[a-f0-9]{64}$/.test(data?.csrfToken || "")
      )
        csrfToken = data.csrfToken;
      if (url === "/api/auth/logout") csrfToken = "";
      return data;
    } catch (error) {
      if (error.status === 401) csrfToken = "";
      if (protectedWrite && error.code === "CSRF_INVALID" && retryCsrf) {
        await readSession();
        return requestJson(url, { ...options, retryCsrf: false });
      }
      // Only reads can be replayed automatically. CRUD and bookings stay single-submit.
      if (safe && attempt === 0 && recoverable(error)) {
        await pause(350, options.signal);
        continue;
      }
      throw error;
    }
  }
}

export async function loginWithRecovery(payload) {
  let login;
  try {
    login = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!recoverable(error)) throw error;
    // A lost response can still have set a cookie. Verify it before sending credentials again.
    try {
      const current = await readSession();
      if (
        current.user?.username.toLowerCase() ===
        payload.username.trim().toLowerCase()
      )
        return current;
    } catch (probeError) {
      if (probeError.status !== 401 && !recoverable(probeError))
        throw probeError;
    }
    await pause(350);
    login = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  let current;
  try {
    current = await readSession();
  } catch (error) {
    if (error.status === 401)
      throw new ApiError(
        "Cookie sesi belum tersimpan. Izinkan cookie situs ini, lalu coba kembali.",
        { code: "COOKIE_REJECTED" },
      );
    throw error;
  }
  if (current.user?.id !== login.user?.id)
    throw new ApiError(
      "Sesi belum dapat diverifikasi. Silakan masuk kembali.",
      { code: "SESSION_MISMATCH" },
    );
  return current;
}
