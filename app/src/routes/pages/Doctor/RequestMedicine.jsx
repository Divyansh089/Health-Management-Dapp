import React, { useState } from 'react';
import { useWeb3 } from '../../../state/Web3Provider.jsx';
import { uploadJSONToIPFS } from '../../../lib/ipfs.js';
import '../../../components/Forms/Form.css';
import '../../../components/Toast/Toast.css';

export default function RequestMedicine() {
  const { signerContract, doctorId } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!signerContract || !doctorId) {
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

      // Prepare medicine request data
      const requestData = {
        ...formData,
        activeIngredients: formData.activeIngredients.filter(ingredient => ingredient.trim()),
        requestedBy: doctorId,
        requestDate: new Date().toISOString(),
        status: 'pending',
        type: 'medicine_request'
      };

      // Upload to IPFS
      const ipfsResult = await uploadJSONToIPFS(requestData);
      
      // Submit medicine request to contract (assuming there's a function for this)
      const tx = await signerContract.requestMedicine(
        doctorId,
        formData.name,
        ipfsResult.cid,
        Math.floor(parseFloat(formData.price) * 100) // Convert to cents/smallest unit
      );
      
      await tx.wait();

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
      showToastMessage('Failed to submit medicine request: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏥 Request New Medicine</h1>
        <p>Submit a request to add a new medicine to the system (requires admin approval)</p>
      </div>

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
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Submitting Request...' : '🚀 Submit Medicine Request'}
          </button>
        </div>
      </form>

      {showToast && (
        <div className={`toast ${toastType} ${showToast ? 'show' : ''}`}>
          <span>{toastMessage}</span>
          <button onClick={() => setShowToast(false)}>✕</button>
        </div>
      )}
    </div>
  );
}