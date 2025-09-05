import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

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
        <button onClick={() => navigate('/patient')} style={buttonStyle}>Patient</button>
        <button onClick={() => navigate('/doctors')} style={buttonStyle}>Doctors</button>
        <button onClick={() => navigate('/marketplace')} style={buttonStyle}>Marketplace</button>
      </div>
    </section>
  );
}

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

export default Home;
