import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../../Context/index';

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
    <section 
      style={{ 
        padding: '150px 20px', 
        textAlign: 'center', 
        backgroundColor: '#e6f2ff', 
        minHeight: '80vh' 
      }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Welcome to ERES</h1>
      <p style={{ fontSize: '20px', maxWidth: '600px', margin: '0 auto 40px' }}>
        ERES is a Decentralized Healthcare Management System that secures patient records, verifies doctors, 
        and provides a safe medicine marketplace using blockchain and IPFS technology.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <button onClick={handleConnectWallet} style={buttonStyle} disabled={loader}>
          {loader ? 'Connecting...' : 'Connect Wallet & Get Started'}
        </button>
        <button onClick={() => navigate('/about')} style={secondaryButtonStyle}>Learn More</button>
      </div>
    </section>
  );
}

const buttonStyle = {
  padding: '15px 30px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.3s ease'
};

const secondaryButtonStyle = {
  padding: '15px 30px',
  backgroundColor: 'transparent',
  color: '#007bff',
  border: '2px solid #007bff',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'all 0.3s ease'
};

export default Home;
