import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return value === "true";
};

const toList = (value, fallback = []) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .concat(fallback)
    .filter((entry, index, all) => all.indexOf(entry) === index);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = env.VITE_HOST || "127.0.0.1";
  const port = Number(env.VITE_PORT || 4172);
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:4173";
  const allowedHosts = toList(env.VITE_ALLOWED_HOSTS, [
    "localhost",
    "127.0.0.1",
  ]);
  const proxy = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
      configure(server) {
        server.on("error", (_error, _req, response) => {
          if (
            !response ||
            typeof response.writeHead !== "function" ||
            response.headersSent
          )
            return;
          response.writeHead(503, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          response.end(
            JSON.stringify({
              code: "SERVICE_UNAVAILABLE",
              message:
                "Server sedang menyiapkan koneksi. Coba kembali sebentar lagi.",
            }),
          );
        });
      },
    },
    "/uploads": { target: proxyTarget, changeOrigin: true },
  };

  return {
    plugins: [react()],
    server: {
      host,
      port,
      strictPort: toBoolean(env.VITE_STRICT_PORT, true),
      allowedHosts,
      headers: {
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      proxy,
    },
    preview: {
      host,
      port,
      strictPort: true,
      allowedHosts,
      proxy,
    },
  };
});
