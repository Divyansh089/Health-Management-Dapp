import InputField from "../Forms/InputField.jsx";
import { formatEntityId, formatDate } from "../../lib/format.js";
import "./Modal.css";
import "../Forms/Form.css";

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

function coalesce(...values) {
  for (const value of values) {
    if (!value) continue;
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (trimmed) return trimmed;
  }
  return "";
}

export default function MedicineDetailModal({
  medicine,
  onClose,
  onSubmitPrice,
  onSubmitStock,
  onToggleActive,
  pricePending = false,
  stockPending = false,
  togglePending = false
}) {
  if (!medicine) return null;

  const metadata = medicine.metadata || {};
  const displayName = coalesce(
    metadata.name,
    medicine.displayName,
    metadata.medicineName,
    medicine.genericName,
    medicine.humanId,
    formatEntityId("MED", medicine.id)
  );
  const subtitle = coalesce(medicine.genericName, metadata.genericName, medicine.manufacturer);
  const metadataLink = resolveLink(medicine.ipfs);
  const imageSrc = medicine.imageUrl || resolveLink(metadata.image) || resolveLink(metadata.imageUrl);
  const fallbackInitial = (displayName || "M").charAt(0).toUpperCase();
  const description = coalesce(metadata.description, medicine.description);
  const storageList = medicine.storage?.length ? medicine.storage : metadata.storage || metadata.storageConditions;
  const ingredientsList = medicine.ingredients?.length ? medicine.ingredients : metadata.ingredients || metadata.activeIngredients;
  const therapeuticClass = coalesce(metadata.therapeuticClass, medicine.therapeuticClass, metadata.category);
  const expiry = coalesce(metadata.expiry, medicine.expiry);
  const batch = coalesce(metadata.batch, medicine.batch);
  const regulatoryId = coalesce(metadata.regulatoryId, medicine.regulatoryId);
  const createdAt = metadata.timestamp || metadata.createdAt || metadata.requestDate;
  const createdDisplay = createdAt ? formatDate(createdAt) : "";
  const lastUpdatedSource = medicine.updatedAt || metadata.updatedAt || metadata.timestamp;
  const lastUpdatedDisplay = lastUpdatedSource ? formatDate(lastUpdatedSource) : "";
  const normalizedStorage = Array.isArray(storageList)
    ? storageList
    : typeof storageList === "string"
    ? storageList
        .split(/\r?\n|[.;,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const normalizedIngredients = Array.isArray(ingredientsList)
    ? ingredientsList
    : typeof ingredientsList === "string"
    ? ingredientsList
        .split(/\r?\n|[,;]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const handlePriceSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = form.get("price");
    onSubmitPrice?.(medicine, value);
    event.currentTarget.reset();
  };

  const handleStockSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = form.get("stock");
    onSubmitStock?.(medicine, value);
    event.currentTarget.reset();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content large-modal medicine-modal">
        <header className="modal-header">
          <div className="medicine-modal-title">
            <h2>{displayName}</h2>
            <p className="medicine-modal-subtitle">
              {subtitle ? `${subtitle} • ` : ""}
              {medicine.humanId || formatEntityId("MED", medicine.id)}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </header>

        <div className="modal-body">
          <section className="medicine-modal-hero">
            <div className={`medicine-modal-thumb ${imageSrc ? "" : "empty"}`}>
              <div className="medicine-modal-thumb-fallback">{fallbackInitial}</div>
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={`${displayName} preview`}
                  onError={(event) => {
                    event.currentTarget.parentElement?.classList.add("empty");
                    event.currentTarget.remove();
                  }}
                />
              )}
            </div>
            <div className="medicine-modal-summary">
              <span className={`strip-status ${medicine.active ? "active" : "inactive"}`}>
                {medicine.active ? "Active" : "Inactive"}
              </span>
              <p className="medicine-modal-description">
                {description || "No description has been provided for this medicine yet."}
              </p>
              <div className="medicine-modal-quick">
                <div>
                  <span>Current Price</span>
                  <strong>{(medicine.priceEth?.toFixed?.(4) ?? medicine.priceEth) || 0} ETH</strong>
                </div>
                <div>
                  <span>In Stock</span>
                  <strong>{medicine.stock}</strong>
                </div>
                {therapeuticClass && (
                  <div>
                    <span>Therapeutic Class</span>
                    <strong>{therapeuticClass}</strong>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="medicine-modal-actions">
            <form className="medicine-action-form" onSubmit={handlePriceSubmit}>
              <InputField
                name="price"
                label="Update Price (ETH)"
                type="number"
                min="0"
                step="0.0001"
                placeholder={Number.isFinite(medicine.priceEth) ? medicine.priceEth.toFixed(4) : "0.0000"}
              />
              <button type="submit" className="secondary-btn" disabled={pricePending}>
                {pricePending ? "Saving…" : "Save Price"}
              </button>
            </form>

            <form className="medicine-action-form" onSubmit={handleStockSubmit}>
              <InputField
                name="stock"
                label="Update Stock"
                type="number"
                min="0"
                step="1"
                placeholder={String(medicine.stock)}
              />
              <button type="submit" className="secondary-btn" disabled={stockPending}>
                {stockPending ? "Saving…" : "Save Stock"}
              </button>
            </form>

            <button
              type="button"
              className="tertiary-btn medicine-toggle-btn"
              onClick={() => onToggleActive?.(medicine)}
              disabled={togglePending}
            >
              {togglePending ? "Updating…" : medicine.active ? "Deactivate" : "Activate"}
            </button>
          </section>

          <section className="medicine-modal-grid">
            <div className="medicine-modal-card">
              <h4>Key Identifiers</h4>
              <div className="medicine-info-grid">
                <div className="medicine-info-item">
                  <span>Human ID</span>
                  <strong>{medicine.humanId || formatEntityId("MED", medicine.id)}</strong>
                </div>
                {medicine.manufacturer && (
                  <div className="medicine-info-item">
                    <span>Manufacturer</span>
                    <strong>{medicine.manufacturer}</strong>
                  </div>
                )}
                {medicine.dosageForm && (
                  <div className="medicine-info-item">
                    <span>Dosage Form</span>
                    <strong>{medicine.dosageForm}</strong>
                  </div>
                )}
                {medicine.strength && (
                  <div className="medicine-info-item">
                    <span>Strength</span>
                    <strong>{medicine.strength}</strong>
                  </div>
                )}
                {regulatoryId && (
                  <div className="medicine-info-item">
                    <span>Regulatory ID</span>
                    <strong>{regulatoryId}</strong>
                  </div>
                )}
                {batch && (
                  <div className="medicine-info-item">
                    <span>Batch</span>
                    <strong>{batch}</strong>
                  </div>
                )}
                {expiry && (
                  <div className="medicine-info-item">
                    <span>Expiry</span>
                    <strong>{expiry}</strong>
                  </div>
                )}
              </div>
            </div>

            {normalizedIngredients.length > 0 && (
              <div className="medicine-modal-card">
                <h4>Active Ingredients</h4>
                <div className="medicine-chip-grid">
                  {normalizedIngredients.map((item, index) => (
                    <span key={index} className="medicine-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {normalizedStorage.length > 0 && (
              <div className="medicine-modal-card">
                <h4>Storage Conditions</h4>
                <div className="medicine-chip-grid">
                  {normalizedStorage.map((item, index) => (
                    <span key={index} className="medicine-chip storage">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="medicine-modal-card">
              <h4>Metadata</h4>
              <div className="medicine-info-grid">
                {createdDisplay && (
                  <div className="medicine-info-item">
                    <span>Metadata Created</span>
                    <strong>{createdDisplay}</strong>
                  </div>
                )}
                <div className="medicine-info-item">
                  <span>Stock Status</span>
                  <strong>{medicine.stock > 0 ? "Available" : "Out of stock"}</strong>
                </div>
                <div className="medicine-info-item">
                  <span>Last Update</span>
                  <strong>{lastUpdatedDisplay || "—"}</strong>
                </div>
              </div>
              {metadataLink && (
                <a
                  href={metadataLink}
                  className="metadata-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  View IPFS Metadata →
                </a>
              )}
            </div>
          </section>
        </div>

        <footer className="modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
