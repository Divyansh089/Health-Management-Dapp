import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useWeb3 } from "../../state/Web3Provider.jsx";
import "./Layout.css";

export default function Sidebar({ title = "", items = [], onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { disconnect } = useWeb3();
  
  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);
  
  if (!items.length) return null;

  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleCollapse}
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? "▶" : "◀"}
      </button>
      {title && <h3>{title}</h3>}
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
          >
            <span className="sidebar-icon" aria-hidden>{item.icon || "⚡"}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
        <button
          className="sidebar-disconnect"
          onClick={handleDisconnect}
          aria-label="Disconnect wallet and return to home"
        >
          <span className="sidebar-icon" aria-hidden>🚪</span>
          <span className="sidebar-disconnect-label">Disconnect</span>
        </button>
      </nav>
    </aside>
  );
}
