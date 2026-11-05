import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function useBlogView(post) {
  const [views, setViews] = useState(null);
  useEffect(() => {
    if (!post) return;
    setViews(null);
    const key = `jit_blog_view_${post.id}_${new Date().toISOString().slice(0, 10)}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* Reading remains available without storage. */
    }
    const controller = new AbortController();
    let timer;
    let sent = false;
    const schedule = () => {
      window.clearTimeout(timer);
      if (document.hidden || sent) return;
      timer = window.setTimeout(() => {
        sent = true;
        api
          .blogView(post.slug, { signal: controller.signal })
          .then((result) => {
            if (controller.signal.aborted) return;
            setViews(result.views);
            try {
              sessionStorage.setItem(key, "1");
            } catch {
              /* The server also deduplicates views. */
            }
          })
          .catch(() => {});
      }, 2000);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [post?.id, post?.slug]);
  return views ?? post?.views ?? 0;
}
