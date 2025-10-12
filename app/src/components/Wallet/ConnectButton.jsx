

import { useCallback } from "react";
import { useWeb3 } from "../../state/Web3Provider.jsx";
import "./Wallet.css";

function shorten(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRole(role) {
  if (!role) return "";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function ConnectButton({ showRole = true, variant = "primary" }) {
  const { account, connect, isConnecting, connectError, role } = useWeb3();

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch {
      // handled via connectError
    }
  }, [connect]);

  return (
    <div className={`wallet wallet-${variant}`}>
      <button className="wallet-btn" onClick={handleConnect} disabled={isConnecting || !!account}>
        {account ? shorten(account) : isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {showRole && account && role && <span className="wallet-role">{formatRole(role)}</span>}
      {connectError && <span className="wallet-error">{connectError.message}</span>}
    </div>
  );
}
