import { useCallback, useEffect, useState } from "react";

export default function useRemoteData(request) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    request: null,
    data: null,
    error: null,
    loading: true,
  });
  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setAttempt((current) => current + 1);
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    setState((current) => ({
      ...current,
      request,
      loading: true,
      error: null,
    }));
    request(controller.signal)
      .then((data) => {
        if (active) setState({ request, data, error: null, loading: false });
      })
      .catch((error) => {
        if (active)
          setState((current) => ({
            ...current,
            request,
            error,
            loading: false,
          }));
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [request, attempt]);
  return {
    ...state,
    loading: state.loading || state.request !== request,
    retry,
  };
}
