import { useState } from "react";
import "./Card.css";
import { formatDate, formatEntityId } from "../../lib/format.js";

function resolveLink(uri) {
  if (!uri) return null;
  if (typeof uri === "object") {
    const nested =
      uri.gatewayUrl ||
      uri.url ||
      uri.ipfsUrl ||
      uri.src ||
      uri.href ||
      uri.cid ||
      uri.hash ||
      null;
    return resolveLink(nested);
  }
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  if (!uri.startsWith("http")) {
    return `https://ipfs.io/ipfs/${uri}`;
  }
  return uri;
}

export default function MedicineCard({
  medicine,
  onAction,
  actionLabel,
  actionDisabled = false,
  footer
}) {
  if (!medicine) return null;

  const metadata = medicine.metadata || {};
  const displayName = medicine.displayName?.trim?.() ||
    medicine.name?.trim?.() ||
    metadata.name ||
    medicine.humanId ||
    formatEntityId("MED", medicine.id);
  const imageSrc = medicine.imageUrl || resolveLink(metadata.image) || resolveLink(metadata.imageUrl);
  const fallbackInitial = (displayName || "M").charAt(0).toUpperCase();
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <article className={`card ${medicine.active ? "card-approved" : "card-pending"}`}>
      <header className="card-header">
        <div className="card-header-content">
          <div className="card-thumb">
            {/* {(!imageSrc || imageError) && (
              <div className="card-thumb-fallback">{fallbackInitial}</div>
            )} */}
            {imageSrc && !imageError && (
              <img
                src={imageSrc}
                alt={`${displayName} preview`}
                style={{ 
                  opacity: imageLoaded ? 1 : 0,
                  display: imageError ? 'none' : 'block'
                }}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageLoaded(false);
                  setImageError(true);
                }}
              />
            )}
          </div>
          <div>
            <h4>{displayName}</h4>
            <span className="card-subtitle">{medicine.ipfs || "Metadata not set"}</span>
          </div>
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
