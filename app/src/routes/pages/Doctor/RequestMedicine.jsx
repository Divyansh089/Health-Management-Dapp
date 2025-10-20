import React, { useEffect, useMemo, useState } from 'react';
import { formatDate, formatEntityId } from '../../../lib/format.js';
import {
  MEDICINE_REQUESTS_EVENT,
  addMedicineRequest,
  getMedicineRequests
} from '../../../lib/medicineRequests.js';
import { uploadJSONToIPFS } from '../../../lib/ipfs.js';
import { useWeb3 } from '../../../state/Web3Provider.jsx';
import Toast from '../../../components/Toast/Toast.jsx';
import '../../../components/Forms/Form.css';
import '../../../components/Tables/Table.css';
import '../../../components/Toast/Toast.css';
import './RequestMedicine.css';

export default function RequestMedicine() {
  const { account, doctorId } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [requests, setRequests] = useState([]);

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    genericName: '',
    manufacturer: '',
    description: '',
    
    // Medical Information
    activeIngredients: [''],
    strength: '',
    dosageForm: 'tablet',
    therapeuticClass: '',
    
    // Regulatory Information
    approvalNumber: '',
    expiryDate: '',
    batchNumber: '',
    
    // Pricing
    price: '',
    currency: 'USD',
    
    // Request Details
    requestReason: '',
    urgencyLevel: 'normal'
  });

  const doctorLabel = useMemo(() => {
    if (!doctorId) return null;
    return formatEntityId('DOC', doctorId);
  }, [doctorId]);

  const canSubmit = Boolean(doctorId);

  useEffect(() => {
    function loadRequests() {
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
    }

    loadRequests();
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = () => loadRequests();
    window.addEventListener(MEDICINE_REQUESTS_EVENT, handler);
    return () => {
      window.removeEventListener(MEDICINE_REQUESTS_EVENT, handler);
    };
  }, [doctorId, account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.activeIngredients];
    newIngredients[index] = value;
    setFormData(prev => ({
      ...prev,
      activeIngredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      activeIngredients: [...prev.activeIngredients, '']
    }));
  };

  const removeIngredient = (index) => {
    if (formData.activeIngredients.length > 1) {
      const newIngredients = formData.activeIngredients.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        activeIngredients: newIngredients
      }));
    }
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
      const requiredFields = ['name', 'genericName', 'manufacturer', 'strength', 'price', 'requestReason'];
      const missingFields = requiredFields.filter(field => !formData[field].trim());
      
      if (missingFields.length > 0) {
        showToastMessage(`Please fill in required fields: ${missingFields.join(', ')}`, 'error');
        return;
      }

      const priceValue = Number(formData.price);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        showToastMessage('Please enter a valid price greater than zero', 'error');
        return;
      }

      const activeIngredients = formData.activeIngredients
        .map((ingredient) => ingredient.trim())
        .filter(Boolean);

      // Prepare medicine request data
      const requestData = {
        ...formData,
        activeIngredients,
        requestedBy: doctorId,
        doctorWallet: account || null,
        doctorLabel: doctorLabel || null,
        requestDate: new Date().toISOString(),
        status: 'pending',
        type: 'medicine_request',
        price: priceValue,
        stock: 0
      };

      // Upload to IPFS
      const ipfsResult = await uploadJSONToIPFS(requestData);
      
      const saved = addMedicineRequest({
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
      setRequests((prev) => [saved, ...prev]);

      showToastMessage('Medicine request submitted successfully! Waiting for admin approval.');
      
      // Reset form
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        description: '',
        activeIngredients: [''],
        strength: '',
        dosageForm: 'tablet',
        therapeuticClass: '',
        approvalNumber: '',
        expiryDate: '',
        batchNumber: '',
        price: '',
        currency: 'USD',
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

            <div className="input-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the medicine..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>🧪 Medical Information</h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Active Ingredients</label>
              {formData.activeIngredients.map((ingredient, index) => (
                <div key={index} className="ingredient-input">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    placeholder="e.g., Acetaminophen 500mg"
                  />
                  {formData.activeIngredients.length > 1 && (
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
              <label>Strength *</label>
              <input
                type="text"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                required
                placeholder="e.g., 500mg"
              />
            </div>

            <div className="input-group">
              <label>Dosage Form</label>
              <select
                name="dosageForm"
                value={formData.dosageForm}
                onChange={handleChange}
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="liquid">Liquid</option>
                <option value="injection">Injection</option>
                <option value="cream">Cream/Ointment</option>
                <option value="drops">Drops</option>
                <option value="inhaler">Inhaler</option>
              </select>
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
          <h3>📜 Regulatory Information</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Approval Number</label>
              <input
                type="text"
                name="approvalNumber"
                value={formData.approvalNumber}
                onChange={handleChange}
                placeholder="FDA/Regulatory approval number"
              />
            </div>

            <div className="input-group">
              <label>Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Batch Number</label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="Manufacturing batch number"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>💰 Pricing</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Price *</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>

            <div className="input-group">
              <label>Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
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
                  <th>Medicine</th>
                  <th>Price</th>
                  <th>Urgency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id ?? item.ipfsCid ?? item.requestDate}>
                    <td>{formatDate(item.requestDate) || '—'}</td>
                    <td>
                      <div className="doctor-info">
                        <strong>{item.medicineName}</strong>
                        <small>{item.genericName || 'Generic name pending'}</small>
                      </div>
                    </td>
                    <td>
                      {item.price !== null && item.price !== '' && Number.isFinite(Number(item.price))
                        ? `${Number(item.price).toFixed(2)} ${item.currency}`
                        : '—'}
                    </td>
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