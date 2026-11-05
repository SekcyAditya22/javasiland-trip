import { useState } from "react";

export default function useDeleteConfirmation({
  deleteItem,
  onDeleted,
  onError,
}) {
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = (item) => setTarget(item);
  const cancelDelete = () => {
    if (!deleting) setTarget(null);
  };
  const confirmDelete = async () => {
    if (!target || deleting) return;
    setDeleting(true);
    try {
      await deleteItem(target);
      await onDeleted?.(target);
      setTarget(null);
    } catch (error) {
      onError?.(error);
    } finally {
      setDeleting(false);
    }
  };

  return {
    target,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
