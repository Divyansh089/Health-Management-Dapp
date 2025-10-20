import "./Card.css";
import { formatDate, formatEntityId } from "../../lib/format.js";

export default function MedicineCard({
  medicine,
  onAction,
  actionLabel,
  actionDisabled = false,
  footer
}) {
  if (!medicine) return null;
  return (
    <article className={`card ${medicine.active ? "card-approved" : "card-pending"}`}>
      <header className="card-header">
        <div>
          <h4>
            {medicine.displayName?.trim?.() ||
              medicine.name?.trim?.() ||
              medicine.humanId ||
              formatEntityId("MED", medicine.id)}
          </h4>
          <span className="card-subtitle">{medicine.ipfs || "Metadata not set"}</span>
        </div>
        <span className={`status-chip ${medicine.active ? "status-success" : "status-muted"}`}>
          {medicine.active ? "Active" : "Inactive"}
        </span>
      </header>

      <div className="card-body">
        <div className="card-row">
          <span>Price</span>
          <strong>{medicine.priceEth?.toFixed?.(4) ?? medicine.priceEth} ETH</strong>
        </div>
        <div className="card-row">
          <span>Stock</span>
          <strong>{medicine.stock}</strong>
        </div>
        {medicine.lastPurchase && (
          <div className="card-row">
            <span>Last purchase</span>
            <strong>{formatDate(medicine.lastPurchase)}</strong>
          </div>
        )}
      </div>

      {(onAction || footer) && (
        <footer className="card-footer">
          {onAction && (
            <button className="card-action" onClick={onAction} disabled={actionDisabled}>
              {actionLabel}
            </button>
          )}
          {footer}
        </footer>
      )}
    </article>
  );
}
