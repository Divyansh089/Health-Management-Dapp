import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);
let idCounter = 0;

function nextId() {
  idCounter += 1;
  return `notif-${Date.now()}-${idCounter}`;
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const pushNotification = useCallback((input) => {
    if (!input) return null;
    const payload = typeof input === "string" ? { message: input } : input;

    const entry = {
      id: payload.id || nextId(),
      title: payload.title || "Update",
      message: payload.message || "",
      type: payload.type || "info",
      createdAt: payload.createdAt || Date.now(),
      read: Boolean(payload.read),
      actionLabel: payload.actionLabel,
      onAction: payload.onAction
    };

    setItems((prev) => [entry, ...prev]);
    return entry.id;
  }, []);

  const markAsRead = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const removeNotification = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount: items.filter((item) => !item.read).length,
      pushNotification,
      markAsRead,
      markAllRead,
      removeNotification,
      clear
    }),
    [items, pushNotification, markAsRead, markAllRead, removeNotification, clear]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
