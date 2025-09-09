import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typewriter } from "react-simple-typewriter";
import { useStateContext } from "../../Context/index.jsx";
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const { address, CONNECT_WALLET, loader } = useStateContext();

  useEffect(() => {
    if (address) {
      navigate('/dashboard');
    }
  }, [address, navigate]);

  const handleConnectWallet = async () => {
    await CONNECT_WALLET();
  };

  return (
    <section className="home-section">
      <h1 className="home-title">Welcome to ERES</h1>
      <p className="home-description">
        ERES is a Decentralized Healthcare Management System that secures patient records, verifies doctors, 
        and provides a safe medicine marketplace using blockchain and IPFS technology.
      </p>
      
      <div className="home-buttonContainer">
        <button onClick={handleConnectWallet} className="home-primaryButton" disabled={loader}>
          {loader ? 'Connecting...' : 'Connect Wallet & Get Started'}
        </button>
        <button onClick={() => navigate('/about')} className="home-secondaryButton">Learn More</button>
      </div>
    </section>
  );
}

export default Home;
