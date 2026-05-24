import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface DeletedItem<T> {
  id: string;
  data: T;
  timestamp: number;
}

interface UndoDeleteOptions {
  timeout?: number;
}

export const useUndoDelete = <T extends { id: string }>(
  onDelete: (id: string) => Promise<void>,
  onRestore: (data: T) => Promise<void>,
  options: UndoDeleteOptions = {}
) => {
  const { timeout = 5000 } = options;
  const [deletedItem, setDeletedItem] = useState<DeletedItem<T> | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleDelete = useCallback(
    async (item: T, itemName: string = 'Item') => {
      // Clear any existing timeout
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
      }

      // Set the deleted item
      setDeletedItem({
        id: item.id,
        data: item,
        timestamp: Date.now(),
      });

      // Show toast with undo option
      const toastId = toast.custom(
        (t) => (
          <div className="flex items-center justify-between gap-3 bg-background border border-border p-3 rounded-lg shadow-lg">
            <span className="text-sm">{itemName} deleted</span>
            <button
              onClick={() => {
                handleUndo();
                toast.dismiss(t);
              }}
              className="text-sm font-medium text-primary hover:text-primary/80 whitespace-nowrap"
            >
              Undo
            </button>
          </div>
        ),
        {
          duration: timeout,
        }
      );

      // Set timeout to permanently delete
      const timeoutId = setTimeout(async () => {
        try {
          await onDelete(item.id);
          setDeletedItem(null);
        } catch (error) {
          console.error('Error permanently deleting item:', error);
          toast.error('Failed to delete item');
        }
      }, timeout);

      setUndoTimeoutId(timeoutId);
    },
    [undoTimeoutId, onDelete, timeout]
  );

  const handleUndo = useCallback(async () => {
    if (!deletedItem) return;

    // Clear timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }

    try {
      await onRestore(deletedItem.data);
      toast.success('Item restored');
      setDeletedItem(null);
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    }
  }, [deletedItem, undoTimeoutId, onRestore]);

  return { handleDelete, handleUndo, deletedItem };
};

export default useUndoDelete;
