import { useEffect, useRef, useState } from "react";

export default function useCarousel({
  count,
  sourceKey,
  autoPlay,
  readyIndex = null,
  intervalSeconds = 5,
  step = 1,
}) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const [interaction, setInteraction] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(!document.hidden);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    setIndex(0);
  }, [sourceKey]);
  useEffect(() => {
    if (count < 2 || !ref.current) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    const syncVisibility = () => setDocumentVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [autoPlay, count]);
  useEffect(() => {
    if (
      !autoPlay ||
      count < 2 ||
      hovered ||
      focused ||
      touching ||
      !visible ||
      !documentVisible ||
      reduced ||
      (readyIndex !== null && index !== readyIndex)
    )
      return;
    const timer = window.setTimeout(
      () => setIndex((current) => (current + step) % count),
      intervalSeconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [
    autoPlay,
    count,
    intervalSeconds,
    step,
    interaction,
    hovered,
    focused,
    touching,
    visible,
    documentVisible,
    reduced,
    index,
    readyIndex,
  ]);
  const select = (next) => {
    if (!count) return;
    setIndex(((next % count) + count) % count);
    setInteraction((current) => current + 1);
  };
  return {
    ref,
    index: count ? index % count : 0,
    reduced,
    visible,
    select,
    interactionProps: {
      onTouchStart: () => setTouching(true),
      onTouchEnd: () => setTouching(false),
      onTouchCancel: () => setTouching(false),
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      },
    },
  };
}
