// MetaMaskLogin.js
import React, { useState } from 'react';
import { ethers } from 'ethers';

function MetaMaskLogin() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User rejected request:", error);
      }
    } else {
      alert("MetaMask not detected! Please install MetaMask extension.");
    }
  };

  return (
    <div>
      {account ? (
        <span style={{ color: 'white', fontWeight: 'bold' }}>
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
      ) : (
        <button 
          onClick={connectWallet} 
          style={{ 
            // padding: '8px 15px', 
            backgroundColor: '#ff9900', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default MetaMaskLogin;
