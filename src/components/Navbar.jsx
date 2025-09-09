import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStateContext } from '../../Context/index.jsx';
import { SHORTEN_ADDRESS } from '../../Context/constants.jsx';
import { FaWallet, FaUser, FaSignOutAlt } from 'react-icons/fa';
import '../styles/Navbar.css';

function Navbar() {
  const { address, CONNECT_WALLET, loader } = useStateContext();
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    if (address) {
      // Check user type logic here if needed
      setUserType('user'); // This will be determined by the dashboard
    }
  }, [address]);

  const handleConnectWallet = async () => {
    await CONNECT_WALLET();
  };

  const handleDisconnect = () => {
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">ERES</Link>
      
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {address && (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/marketplace" className="nav-link">Marketplace</Link>
            <Link to="/doctors" className="nav-link">Doctors</Link>
            <Link to="/chat" className="nav-link">Chat</Link>
            <Link to="/notifications" className="nav-link">Notifications</Link>
          </>
        )}
        <Link to="/about" className="nav-link">About</Link>
      </div>

      <div className="wallet-section">
        {address ? (
          <div className="user-info">
            <div className="wallet-address">
              <FaUser style={{ marginRight: '8px' }} />
              {SHORTEN_ADDRESS(address)}
            </div>
            <button onClick={handleDisconnect} className="disconnect-btn">
              <FaSignOutAlt />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleConnectWallet} 
            className="connect-wallet-btn"
            disabled={loader}
          >
            <FaWallet style={{ marginRight: '8px' }} />
            {loader ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
