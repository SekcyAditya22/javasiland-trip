import { useCallback, useEffect, useState } from "react";
import { api, CATALOG_UPDATED_EVENT } from "../lib/api";

export default function useCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  useEffect(() => {
    window.addEventListener(CATALOG_UPDATED_EVENT, retry);
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, retry);
  }, [retry]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    setError(false);
    api
      .catalog({ signal: controller.signal })
      .then((data) => {
        if (
          ![
            "packages",
            "fleet",
            "rentalRates",
            "promos",
            "faqs",
            "homepage",
          ].every((key) => Array.isArray(data[key]))
        )
          throw new Error("Invalid catalog");
        if (active) setCatalog(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { catalog, loading, error, retry };
}
