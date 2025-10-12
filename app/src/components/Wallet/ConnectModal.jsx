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
            <h3>Connect Your Wallet</h3>
            <p>
              Link your Ethereum wallet to unlock personalised dashboards, manage appointments, and access the full MediFuse experience.
            </p>
            <ul className="connect-steps">
              <li>Securely authenticate with MetaMask or another browser wallet.</li>
              <li>We detect your role automatically - admin, doctor, or patient.</li>
              <li>Enjoy streamlined healthcare coordination on the Holesky network.</li>
            </ul>
            <button className="primary-btn connect-action" disabled={isConnecting} onClick={handleConnect}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
            {connectError && <span className="connect-error">{connectError.message}</span>}
          </>
        )}

        {stage === "choose" && (
          <>
            <h3>Welcome to MediFuse</h3>
            <p>Select how you want to join the network. We will guide you through a quick on-chain registration.</p>
            <div className="connect-option-grid">
              <article className="connect-option">
                <h4>Register as Doctor</h4>
                <p>Verify your credentials, receive approvals, and start serving patients with transparent payouts.</p>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleNavigate("/onboard/doctor")}
                >
                  Continue as Doctor
                </button>
              </article>
              <article className="connect-option">
                <h4>Register as Patient</h4>
                <p>Build a secure medical profile, browse trusted doctors, and manage appointments effortlessly.</p>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleNavigate("/onboard/patient")}
                >
                  Continue as Patient
                </button>
              </article>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
