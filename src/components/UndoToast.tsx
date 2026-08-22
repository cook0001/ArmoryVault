import { Undo2, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UndoToastItem {
  id: string;
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoToastContextType {
  showUndo: (message: string, onUndo: () => void, durationMs?: number) => void;
}

const UndoToastContext = React.createContext<UndoToastContextType | null>(null);

export const useUndoToast = (): UndoToastContextType => {
  const ctx = React.useContext(UndoToastContext);
  if (!ctx) {
    return {
      showUndo: () => {},
    };
  }
  return ctx;
};

/**
 * UndoToastProvider renders a timed toast with an "Undo" button.
 * When a deletion is soft-executed, the caller provides:
 *  - A message to display (e.g., "Firearm deleted")
 *  - An onUndo callback that restores the deleted entity
 *  - An optional duration (default: 10 seconds)
 *
 * After the timer expires the toast dismisses and the deletion is permanent.
 */
export const UndoToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<UndoToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showUndo = useCallback((message: string, onUndo: () => void, durationMs = 10000) => {
    const id = `undo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: UndoToastItem = { id, message, onUndo, durationMs };

    setToasts((prev) => [...prev, item]);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, durationMs);

    timersRef.current.set(id, timer);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const handleUndo = (toast: UndoToastItem) => {
    toast.onUndo();
    dismiss(toast.id);
  };

  return (
    <UndoToastContext.Provider value={{ showUndo }}>
      {children}

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="undo-toast-stack">
          {toasts.map((toast) => (
            <div key={toast.id} className="undo-toast">
              <span className="undo-toast-message">{toast.message}</span>
              <button className="undo-toast-btn" onClick={() => handleUndo(toast)}>
                <Undo2 size={14} />
                Undo
              </button>
              <button
                className="undo-toast-close"
                onClick={() => dismiss(toast.id)}
                title="Dismiss"
              >
                <X size={14} />
              </button>
              <div
                className="undo-toast-progress"
                style={{
                  animationDuration: `${toast.durationMs || 10000}ms`,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </UndoToastContext.Provider>
  );
};
