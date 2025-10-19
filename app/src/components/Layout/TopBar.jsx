import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import ConnectButton from "../Wallet/ConnectButton.jsx";
import { useSearch } from "../../state/SearchContext.jsx";
import { useNotifications } from "../../state/NotificationContext.jsx";
import { formatRelativeTime } from "../../lib/format.js";
import "./Layout.css";

export default function TopBar() {
  const { query, setQuery, placeholder } = useSearch();
  const { items, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  }, [isOpen, unreadCount, markAllRead]);

  const recentNotifications = useMemo(
    () => items.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10),
    [items]
  );

  return (
    <header className="topbar">
      <div className="topbar-left">
        <NavLink to="/" className="nav-brand">
          MediFuse
        </NavLink>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <input
            type="search"
            value={query}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="topbar-icon" aria-hidden>
            🔍
          </span>
        </div>
        <div className="topbar-notification-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            aria-label={isOpen ? "Close notifications" : "Open notifications"}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            🔔
            {unreadCount > 0 && <span className="topbar-badge" aria-hidden>{unreadCount}</span>}
          </button>
          {isOpen && (
            <div className="topbar-notifications" role="menu">
              <div className="topbar-notifications-header">
                <span>Notifications</span>
                {recentNotifications.length > 0 && (
                  <button type="button" onClick={markAllRead} className="topbar-notifications-clear">
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="topbar-notifications-list">
                {recentNotifications.length === 0 ? (
                  <li className="topbar-notification-empty">You're all caught up.</li>
                ) : (
                  recentNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`topbar-notification-item ${notification.read ? "" : "unread"}`}
                    >
                      <div className="topbar-notification-content">
                        <strong>{notification.title}</strong>
                        {notification.message && <p>{notification.message}</p>}
                        <time dateTime={new Date(notification.createdAt).toISOString()}>
                          {formatRelativeTime(notification.createdAt)}
                        </time>
                      </div>
                      {notification.onAction && (
                        <button
                          type="button"
                          className="topbar-notification-action"
                          onClick={() => {
                            notification.onAction?.();
                            markAsRead(notification.id);
                            setIsOpen(false);
                          }}
                        >
                          {notification.actionLabel || "View"}
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
