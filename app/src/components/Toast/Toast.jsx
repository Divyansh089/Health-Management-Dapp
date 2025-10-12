import { useEffect, useState } from "react";
import "./Toast.css";

export default function Toast({ message, type = "info", duration = 4000, onDismiss }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
}
