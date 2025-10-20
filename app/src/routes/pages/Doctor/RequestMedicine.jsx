import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import {
  MEDICINE_REQUESTS_EVENT,
  addMedicineRequest,
  getMedicineRequests
} from "../../../lib/medicineRequests.js";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { DOSAGE_FORMS, STORAGE_CONDITIONS } from "../../../lib/medicineConstants.js";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import "../../../components/Forms/Form.css";
import "../../../components/Tables/Table.css";
import "../../../components/Toast/Toast.css";
import "./RequestMedicine.css";

export default function RequestMedicine() {
  const { account, doctorId } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [requests, setRequests] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    manufacturer: "",
    imageUrl: "",
    description: "",
    dosageForm: "",
    strength: "",
    therapeuticClass: "",
    ingredients: [""],
    batch: "",
    expiry: "",
    regulatoryId: "",
    storage: [],
    price: "",
    stock: "",
    requestReason: "",
    urgencyLevel: "normal"
  });

  const doctorLabel = useMemo(() => {
    if (!doctorId) return null;
    return formatEntityId('DOC', doctorId);
  }, [doctorId]);

  const canSubmit = Boolean(doctorId);

  const refreshRequests = useCallback(() => {
    const all = getMedicineRequests();
    if (doctorId) {
      setRequests(all.filter((item) => Number(item?.doctorId) === Number(doctorId)));
      return;
    }
    if (account) {
      setRequests(all.filter((item) => item?.doctorAddress?.toLowerCase?.() === account.toLowerCase()));
      return;
    }
    setRequests(all);
  }, [doctorId, account]);

  useEffect(() => {
    refreshRequests();
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = () => refreshRequests();
    window.addEventListener(MEDICINE_REQUESTS_EVENT, handler);
    return () => {
      window.removeEventListener(MEDICINE_REQUESTS_EVENT, handler);
    };
  }, [doctorId, account, refreshRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ""]
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        ingredients: newIngredients
      }));
    }
  };

  const toggleStorageCondition = (condition) => {
    setFormData((prev) => {
      const hasCondition = prev.storage.includes(condition);
      const nextStorage = hasCondition
        ? prev.storage.filter((item) => item !== condition)
        : [...prev.storage, condition];
      return { ...prev, storage: nextStorage };
    });
  };

  const generateClientRequestId = () => {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const showToastMessage = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!doctorId) {
      showToastMessage('Please connect your wallet and ensure you are registered as a doctor', 'error');
      return;
    }

    try {
      setLoading(true);

      // Validate required fields
      const requiredFields = [
        "name",
        "genericName",
        "manufacturer",
        "dosageForm",
        "strength",
        "batch",
        "expiry",
        "regulatoryId",
        "price",
        "stock",
        "description",
        "requestReason"
      ];
      const missingFields = requiredFields.filter(field => !formData[field].trim());
      
      if (missingFields.length > 0) {
        showToastMessage(`Please fill in required fields: ${missingFields.join(', ')}`, 'error');
        return;
      }

      const priceValue = Number(formData.price);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        showToastMessage('Please enter a valid price in ETH greater than zero', 'error');
        return;
      }

      const stockValue = Number(formData.stock);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        showToastMessage('Please enter a valid stock quantity (0 or greater)', 'error');
        return;
      }

      const ingredients = formData.ingredients
        .map((ingredient) => ingredient.trim())
        .filter(Boolean);

      if (ingredients.length === 0) {
        showToastMessage('Please provide at least one ingredient', 'error');
        return;
      }

      const storageNotes = formData.storage;
      if (storageNotes.length === 0) {
        showToastMessage('Select at least one storage condition', 'error');
        return;
      }

      const imageUrl = (formData.imageUrl || '').trim();

      const clientRequestId = generateClientRequestId();

      // Prepare medicine request data
      const requestData = {
        ...formData,
        ingredients,
        storage: storageNotes,
        batch: formData.batch,
        expiry: formData.expiry,
        regulatoryId: formData.regulatoryId,
        requestedBy: doctorId,
        doctorWallet: account || null,
        doctorLabel: doctorLabel || null,
        requestDate: new Date().toISOString(),
        status: 'pending',
        type: 'medicine_request',
        price: priceValue,
        stock: stockValue,
        currency: 'ETH',
        clientRequestId,
        imageUrl: imageUrl || null,
        image: imageUrl || null
      };

      // Upload to IPFS
      const ipfsResult = await uploadJSONToIPFS({
        ...requestData,
        type: 'medicine_request',
        timestamp: new Date().toISOString()
      });
      
      addMedicineRequest({
        ...requestData,
        doctorId,
        doctorAddress: account || null,
        doctorName: doctorLabel || `Doctor ${doctorId}`,
        medicineName: formData.name,
        genericName: formData.genericName,
        manufacturer: formData.manufacturer,
        description: formData.description,
        ipfsCid: ipfsResult.cid,
        ipfsUrl: ipfsResult.ipfsUrl,
        metadata: requestData,
        status: 'pending'
      });
      refreshRequests();
      showToastMessage('Medicine request submitted successfully! Waiting for admin approval.');
      
      // Reset form
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        imageUrl: '',
        description: '',
        dosageForm: '',
        strength: '',
        therapeuticClass: '',
        ingredients: [''],
        batch: '',
        expiry: '',
        regulatoryId: '',
        storage: [],
        price: '',
        stock: '',
        requestReason: '',
        urgencyLevel: 'normal'
      });

    } catch (error) {
      console.error('Medicine request error:', error);
      const message = error?.message ? String(error.message) : 'Unknown error';
      showToastMessage('Failed to submit medicine request: ' + message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-medicine-page">
      <div className="page-header">
        <h1>🏥 Request New Medicine</h1>
        <p>Submit a request to add a new medicine to the system (requires admin approval)</p>
      </div>

      {doctorLabel ? (
        <div className="info-banner">
          You are submitting as <strong>{doctorLabel}</strong>. Provide detailed information to help
          the admin verify this medicine quickly.
        </div>
      ) : (
        <div className="info-banner warning">
          Connect your wallet and ensure your doctor profile is approved before submitting a
          request.
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-section">
          <h3>📋 Basic Information</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Medicine Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Paracetamol"
              />
            </div>

            <div className="input-group">
              <label>Generic Name *</label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleChange}
                required
                placeholder="e.g., Acetaminophen"
              />
            </div>

            <div className="input-group">
              <label>Manufacturer *</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                required
                placeholder="e.g., Johnson & Johnson"
              />
            </div>

            <div className="input-group">
              <label>Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://gateway.pinata.cloud/ipfs/..."
              />
            </div>

            <div className="input-group">
              <label>Dosage Form *</label>
              <select
                name="dosageForm"
                value={formData.dosageForm}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select dosage form</option>
                {DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form}>
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Strength *</label>
              <input
                type="text"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                required
                placeholder="e.g., 500 mg"
              />
            </div>

            <div className="input-group full-width">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the medicine..."
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>🧪 Composition & Therapeutic Info</h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Ingredients *</label>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-input">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    placeholder="e.g., Acetaminophen 500mg"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="btn-remove"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addIngredient} className="btn-add">
                ➕ Add Ingredient
              </button>
            </div>

            <div className="input-group">
              <label>Therapeutic Class</label>
              <input
                type="text"
                name="therapeuticClass"
                value={formData.therapeuticClass}
                onChange={handleChange}
                placeholder="e.g., Analgesic, Antibiotic"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📜 Regulatory & Handling</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Regulatory ID *</label>
              <input
                type="text"
                name="regulatoryId"
                value={formData.regulatoryId}
                onChange={handleChange}
                required
                placeholder="Regulatory approval number"
              />
            </div>

            <div className="input-group">
              <label>Expiry Date *</label>
              <input
                type="date"
                name="expiry"
                value={formData.expiry}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Batch Number *</label>
              <input
                type="text"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                required
                placeholder="Manufacturing batch number"
              />
            </div>
          </div>
          <div className="storage-grid">
            <label>Storage Conditions *</label>
            <div className="checkbox-grid">
              {STORAGE_CONDITIONS.map((condition) => (
                <label key={condition} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.storage.includes(condition)}
                    onChange={() => toggleStorageCondition(condition)}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>💰 Pricing & Inventory</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Price (ETH) *</label>
              <input
                type="number"
                step="0.0001"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.0000"
              />
            </div>

            <div className="input-group">
              <label>Initial Stock *</label>
              <input
                type="number"
                step="1"
                min="0"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                placeholder="e.g., 100"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📋 Request Details</h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Reason for Request *</label>
              <textarea
                name="requestReason"
                value={formData.requestReason}
                onChange={handleChange}
                required
                placeholder="Explain why this medicine should be added to the system..."
                rows={4}
              />
            </div>

            <div className="input-group">
              <label>Urgency Level</label>
              <select
                name="urgencyLevel"
                value={formData.urgencyLevel}
                onChange={handleChange}
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !canSubmit}
            className="btn-primary"
            title={canSubmit ? undefined : 'Connect with an approved doctor wallet to submit'}
          >
            {loading ? '⏳ Submitting Request...' : '🚀 Submit Medicine Request'}
          </button>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="form-section recent-requests">
        <h3>📦 Recent Requests</h3>
        {requests.length === 0 ? (
          <p className="empty-table">You have not submitted any medicine requests yet.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Image</th>
                  <th>Medicine</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Urgency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id ?? item.ipfsCid ?? item.requestDate}>
                    <td>{formatDate(item.requestDate) || '—'}</td>
                    <td>
                      {(item.imageUrl || item.image) ? (
                        <img
                          src={item.imageUrl || item.image}
                          alt={item.medicineName || 'Medicine image'}
                          className="request-image-thumb"
                          onError={(event) => {
                            event.currentTarget.classList.add('hidden');
                          }}
                        />
                      ) : (
                        <span className="request-image-placeholder">No image</span>
                      )}
                    </td>
                    <td>
                      <div className="doctor-info">
                        <strong>{item.medicineName}</strong>
                        <small>{item.genericName || 'Generic name pending'}</small>
                      </div>
                    </td>
                    <td>
                      {item.price !== null && item.price !== '' && Number.isFinite(Number(item.price))
                        ? `${Number(item.price).toFixed(4)} ETH`
                        : '—'}
                    </td>
                    <td>{Number.isFinite(Number(item.stock)) ? Number(item.stock) : '—'}</td>
                    <td>
                      <span className={`urgency-pill ${(item.urgencyLevel || 'normal').toLowerCase()}`}>
                        {item.urgencyLevel?.toUpperCase?.() || 'NORMAL'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${(item.status || 'pending').toLowerCase()}`}>
                        {item.status?.toUpperCase?.() || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}