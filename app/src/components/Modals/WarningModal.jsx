import "./Modal.css";

export default function WarningModal({
  open,
  title = "Warning",
  message,
  onClose
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal warning-modal">
        <button 
          className="modal-close-x" 
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="warning-icon">⚠️</div>
        <h3>{title}</h3>
        <p className="warning-message">{message}</p>
        <div className="modal-actions">
          <button 
            type="button" 
            className="modal-confirm warning-ok" 
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
