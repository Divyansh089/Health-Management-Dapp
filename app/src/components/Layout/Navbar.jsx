import { NavLink, useLocation } from "react-router-dom";
import ConnectButton from "../Wallet/ConnectButton.jsx";
import { useWeb3 } from "../../state/Web3Provider.jsx";
import "./Layout.css";

export default function Navbar() {
  const location = useLocation();
  const { role } = useWeb3();
  const onLanding = location.pathname === "/";
  const onRegistration = location.pathname.startsWith("/onboard/");

  if ((!onLanding && role) || onRegistration) {
    return null;
  }

  const landingLinks = [
    { href: "#achievements", label: "Highlights" },
    { href: "#impact", label: "Impact" },
    { href: "#fees", label: "Fees" },
    { href: "#community", label: "Reviews" }
  ];

  const visitorLinks = [
    { to: "/public/doctors", label: "Doctors" },
    { to: "/public/medicines", label: "Medicines" }
  ];

  return (
    <header className={`nav ${onLanding ? "nav-landing" : ""}`}>
      <div className="nav-left">
        <NavLink to="/" className="nav-brand">
          MediFuse
        </NavLink>
      </div>
      <nav className="nav-right">
        {onLanding
          ? landingLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))
          : visitorLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        <ConnectButton showRole={false} variant={onLanding ? "secondary" : "primary"} />
      </nav>
    </header>
  );
}
