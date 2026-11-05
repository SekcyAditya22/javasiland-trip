import { useCallback, useRef, useState } from "react";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const sequence = useRef(0);
  const notify = useCallback((message, type = "success") => {
    if (!message) return;
    const id = ++sequence.current;
    setNotifications((current) =>
      [{ id, message, type }, ...current].slice(0, 3),
    );
  }, []);
  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((notice) => notice.id !== id));
  }, []);
  return { notifications, notify, dismiss };
}
