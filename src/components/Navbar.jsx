import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">ERES</h2>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/patient" className="nav-link">Patient</Link>
        <Link to="/doctors" className="nav-link">Doctors</Link>
        <Link to="/marketplace" className="nav-link">Marketplace</Link>
        <Link to="/about" className="nav-link">About</Link>
      </div>
    </nav>
  );
}

export default Navbar;
