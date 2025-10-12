import { NavLink } from "react-router-dom";
import ConnectButton from "../Wallet/ConnectButton.jsx";
import "./Layout.css";

export default function TopBar({ placeholder = "Search...", onSearch }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <NavLink to="/" className="nav-brand">MediFuse</NavLink>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <input
            type="search"
            placeholder={placeholder}
            onChange={(event) => onSearch?.(event.target.value)}
          />
          <span className="topbar-icon" aria-hidden>🔍</span>
        </div>
        <button type="button" className="topbar-icon-btn" aria-label="Notifications">🔔</button>
        <ConnectButton />
      </div>
    </header>
  );
}
