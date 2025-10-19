import { useEffect, useState } from "react";
import { useNotifications } from "../../state/NotificationContext.jsx";
import "./Toast.css";

export default function Toast({ message, type = "info", duration = 4000, onDismiss }) {
  const [visible, setVisible] = useState(Boolean(message));
  const { pushNotification } = useNotifications();

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  useEffect(() => {
    if (!message) return;
    const title = type === "error" ? "Error" : type === "success" ? "Success" : "Notification";
    pushNotification({ title, message, type, createdAt: Date.now() });
  }, [message, type, pushNotification]);

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
