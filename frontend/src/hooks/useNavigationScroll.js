import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import {
  flushScrollPositions,
  isScrollPosition,
  rememberScrollPosition,
  savedScrollPosition,
} from "../lib/scrollPositions";

const currentPoint = () => ({ x: window.scrollX, y: window.scrollY });
const scrollKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);
const loadingSelector =
  '.page-loading[aria-busy="true"], .admin-session-pending[aria-busy="true"]';

export default function useNavigationScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const active = useRef(null);

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const capture = () => {
      if (!active.current || active.current.restoring) return;
      active.current.point = currentPoint();
      rememberScrollPosition(active.current.location, active.current.point);
    };
    const flush = () => {
      capture();
      flushScrollPositions();
    };
    const hide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("scroll", capture, { passive: true });
    window.addEventListener("click", capture, true);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.history.scrollRestoration = previous;
      window.removeEventListener("scroll", capture);
      window.removeEventListener("click", capture, true);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hide);
      flush();
    };
  }, []);

  useLayoutEffect(() => {
    const previous = active.current;
    // Use the last captured position: the new page DOM may already be shorter.
    if (previous && !previous.restoring)
      rememberScrollPosition(previous.location, previous.point);
    const saved =
      navigationType === "POP" ? savedScrollPosition(location) : null;
    const explicit = location.state?.restoreScrollPosition;
    const preserve =
      location.state?.preserveScroll &&
      previous?.location.pathname === location.pathname;
    const target =
      saved ||
      (isScrollPosition(explicit) ? explicit : null) ||
      (preserve ? previous.point : null);
    const entry = {
      location,
      point: target || { x: 0, y: 0 },
      restoring: true,
    };
    active.current = entry;

    let frame;
    let timeout;
    let resizeObserver;
    let mutationObserver;
    let stopped = false;
    const stopWatching = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("pointerdown", interrupt);
      window.removeEventListener("keydown", onKey);
    };
    const finish = () => {
      if (stopped) return;
      stopped = true;
      stopWatching();
      entry.restoring = false;
      entry.point = currentPoint();
      rememberScrollPosition(location, entry.point);
    };
    const interrupt = () => finish();
    const onKey = (event) => {
      if (scrollKeys.has(event.key)) interrupt();
    };
    const attempt = () => {
      if (stopped) return;
      if (target) {
        window.scrollTo({ left: target.x, top: target.y, behavior: "instant" });
        // A returning page can still be a skeleton. Wait for the actual content
        // and enough document height instead of keeping the clamped position.
        const ready = !document.querySelector(loadingSelector);
        if (
          ready &&
          Math.abs(window.scrollY - target.y) <= 1 &&
          Math.abs(window.scrollX - target.x) <= 1
        )
          finish();
      } else if (location.hash) {
        let id;
        try {
          id = decodeURIComponent(location.hash.slice(1));
        } catch {
          finish();
          return;
        }
        const element = document.getElementById(id);
        if (!element || document.querySelector(loadingSelector)) return;
        const samePage = previous?.location.pathname === location.pathname;
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        element.scrollIntoView({
          behavior: samePage && !reduced ? "smooth" : "instant",
          block: "start",
        });
        finish();
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        finish();
      }
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(attempt);
    };
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("pointerdown", interrupt, { passive: true });
    window.addEventListener("keydown", onKey);
    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);
    mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    timeout = window.setTimeout(finish, 15000);
    if (!target && previous?.location.pathname !== location.pathname)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    attempt();
    // Cancel any final compositor frame left by smooth scrolling on departure.
    if (stopped && !target && !location.hash)
      frame = window.requestAnimationFrame(() =>
        window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
      );
    return () => {
      stopped = true;
      stopWatching();
    };
  }, [
    location.key,
    location.pathname,
    location.search,
    location.hash,
    navigationType,
  ]);
}
