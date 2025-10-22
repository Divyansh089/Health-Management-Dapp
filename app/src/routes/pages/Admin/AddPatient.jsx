import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import InputField from "../../../components/Forms/InputField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { ROLES } from "../../../lib/constants.js";

export default function AddPatient() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role, signerContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    walletAddress: "",
    name: "",
    age: "",
    bloodGroup: "",
    email: "",
    phone: "",
    emergencyContact: "",
    address: "",
    city: "",
    country: "",
    allergies: [],
    conditions: []
  });

  const isAdmin = role === ROLES.ADMIN;

  const addPatient = useMutation({
    mutationFn: async (patientData) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      
      setIsUploading(true);
      try {
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "patient",
          name: patientData.name,
          profile: {
            age: parseInt(patientData.age),
            bloodGroup: patientData.bloodGroup
          },
          contact: {
            email: patientData.email,
            phone: patientData.phone,
            emergency: patientData.emergencyContact
          },
          location: {
            address: patientData.address,
            city: patientData.city,
            country: patientData.country
          },
          allergies: patientData.allergies,
          conditions: patientData.conditions,
          timestamp: new Date().toISOString(),
          addedByAdmin: true,
          walletAddress: patientData.walletAddress
        });

        // Register patient on-chain with admin function
        const tx = await signerContract.adminRegisterPatient(patientData.walletAddress, ipfsUrl);
        await tx.wait();
        
        return { ipfsUrl, walletAddress: patientData.walletAddress };
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "patients"] });
      setToast({ type: "success", message: `Patient added successfully! Wallet: ${data.walletAddress}` });
      
      // Reset form
      setFormData({
        walletAddress: "",
        name: "",
        age: "",
        bloodGroup: "",
        email: "",
        phone: "",
        emergencyContact: "",
        address: "",
        city: "",
        country: "",
        allergies: [],
        conditions: []
      });
      formRef.current?.reset();
      
      // Redirect to patients page after a short delay
      setTimeout(() => {
        navigate("/admin/patients");
      }, 2000);
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to add patient." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    
    const patientData = {
      walletAddress: form.get("walletAddress"),
      name: form.get("name"),
      age: form.get("age"),
      bloodGroup: form.get("bloodGroup"),
      email: form.get("email"),
      phone: form.get("phone"),
      emergencyContact: form.get("emergencyContact"),
      address: form.get("address"),
      city: form.get("city"),
      country: form.get("country"),
      allergies: formData.allergies,
      conditions: formData.conditions
    };

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(patientData.walletAddress)) {
      setToast({ type: "error", message: "Please enter a valid wallet address (0x...)" });
      return;
    }

    addPatient.mutate(patientData);
  };

  const addAllergy = () => {
    const allergy = prompt("Enter allergy:");
    if (allergy && allergy.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy.trim()]
      }));
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    const condition = prompt("Enter medical condition:");
    if (condition && condition.trim()) {
      setFormData(prev => ({
        ...prev,
        conditions: [...prev.conditions, condition.trim()]
      }));
    }
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Add Patient by Wallet</h2>
          <p>Access denied. Connect with the admin wallet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>Add Patient by Wallet Address</h2>
        <p>Register a new patient directly using their wallet address. The wallet holder will be able to connect and access the patient dashboard immediately.</p>
        
        <form className="form-grid" onSubmit={handleSubmit} ref={formRef}>
          <InputField
            name="walletAddress"
            label="Patient's Wallet Address"
            placeholder="0x1234567890123456789012345678901234567890"
            value={formData.walletAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
            required
          />

          <InputField
            name="name"
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <InputField
            name="age"
            label="Age"
            type="number"
            min="0"
            max="150"
            placeholder="25"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            required
          />

          <div className="form-group">
            <label htmlFor="bloodGroup">Blood Group</label>
            <select
              name="bloodGroup"
              id="bloodGroup"
              className="form-input"
              value={formData.bloodGroup}
              onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
              required
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <InputField
            name="email"
            label="Email Address"
            type="email"
            placeholder="patient@email.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />

          <InputField
            name="phone"
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />

          <InputField
            name="emergencyContact"
            label="Emergency Contact"
            placeholder="+1 (555) 987-6543"
            value={formData.emergencyContact}
            onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
            required
          />

          <InputField
            name="address"
            label="Address"
            placeholder="123 Main Street"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            required
          />

          <InputField
            name="city"
            label="City"
            placeholder="New York"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            required
          />

          <InputField
            name="country"
            label="Country"
            placeholder="United States"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            required
          />

          <div className="form-group form-full-width">
            <div className="ingredients-header">
              <label>Allergies</label>
              <button type="button" onClick={addAllergy} className="secondary-btn">
                Add Allergy
              </button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="ingredients-list">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="ingredient-item">
                    <span>{allergy}</span>
                    <button 
                      type="button" 
                      onClick={() => removeAllergy(index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group form-full-width">
            <div className="ingredients-header">
              <label>Medical Conditions</label>
              <button type="button" onClick={addCondition} className="secondary-btn">
                Add Condition
              </button>
            </div>
            {formData.conditions.length > 0 && (
              <div className="ingredients-list">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="ingredient-item">
                    <span>{condition}</span>
                    <button 
                      type="button" 
                      onClick={() => removeCondition(index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="primary-btn form-full-width"
            disabled={addPatient.isPending || isUploading}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : addPatient.isPending
              ? "Adding Patient..."
              : "Add Patient"}
          </button>
        </form>

        <div className="panel-note">
          <p><strong>Note:</strong> The patient will need to connect with the specified wallet address to access their dashboard. Make sure the wallet address is correct and belongs to the intended patient.</p>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          duration={5000}
        />
      )}
    </section>
  );
}