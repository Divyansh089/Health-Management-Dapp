import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../state/Web3Provider.jsx";
import useRole from "../../hooks/useRole.js";
import "./ConnectModal.css";

export default function ConnectModal({ open, onClose }) {
  const navigate = useNavigate();
  const { account, connect, isConnecting, connectError } = useWeb3();
  const { role, isLoading: isLoadingRole } = useRole();
  const [stage, setStage] = useState("connect");

  useEffect(() => {
    if (!open) return;
    setStage(account && !role ? "choose" : "connect");
  }, [open, account, role]);

  useEffect(() => {
    if (!open) return;
    if (account) {
      if (!isLoadingRole && role) {
        onClose?.();
      } else if (!role) {
        setStage("choose");
      }
    }
  }, [account, role, isLoadingRole, open, onClose]);

  if (!open) return null;

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // handled via connectError state
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <div className="connect-modal-backdrop" role="dialog" aria-modal="true">
      <div className="connect-modal">
        <button className="connect-close" onClick={onClose} aria-label="Close connect wallet dialog">
          X
        </button>

        {stage === "connect" && (
          <>
            <div className="connect-modal-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <h3>Connect Your Wallet</h3>
            <p>
              Link your Ethereum wallet to unlock personalized dashboards, manage appointments, and access the full MediFuse experience.
            </p>
            <div className="connect-features">
              <div className="connect-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Secure authentication with MetaMask</span>
              </div>
              <div className="connect-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
                <span>Automatic role detection</span>
              </div>
              <div className="connect-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Instant access to healthcare coordination</span>
              </div>
            </div>
            <button className="primary-btn connect-action" disabled={isConnecting} onClick={handleConnect}>
              {isConnecting ? (
                <>
                  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  Connect Wallet
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
            {connectError && (
              <div className="connect-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {connectError.message}
              </div>
            )}
          </>
        )}

        {stage === "choose" && (
          <>
            <div className="connect-modal-icon success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Welcome to MediFuse</h3>
            <p>Select how you want to join the network. We'll guide you through a quick on-chain registration.</p>
            <div className="connect-option-grid">
              <article className="connect-option">
                <div className="option-icon doctor">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h4>Register as Doctor</h4>
                <p>Verify your credentials, receive approvals, and start serving patients with transparent payouts.</p>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleNavigate("/onboard/doctor")}
                >
                  Continue as Doctor
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </article>
              <article className="connect-option">
                <div className="option-icon patient">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h4>Register as Patient</h4>
                <p>Build a secure medical profile, browse trusted doctors, and manage appointments effortlessly.</p>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleNavigate("/onboard/patient")}
                >
                  Continue as Patient
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </article>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
