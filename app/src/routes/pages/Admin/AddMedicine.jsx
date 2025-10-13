import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { ROLES } from "../../../lib/constants.js";

const DOSAGE_FORMS = [
  "tablet", "capsule", "syrup", "injection", "cream", "ointment", 
  "drops", "inhaler", "patch", "suppository"
];

const STORAGE_CONDITIONS = [
  "Store below 25°C", "Store in refrigerator (2-8°C)", "Store below 30°C",
  "Keep dry", "Protect from light", "Store in original container"
];

export default function AddMedicine() {
  const queryClient = useQueryClient();
  const { role, signerContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dosageForm: "",
    strength: "",
    manufacturer: "",
    batch: "",
    expiry: "",
    description: "",
    storage: [],
    regulatoryId: "",
    ingredients: [],
    price: ""
  });

  const isAdmin = role === ROLES.ADMIN;

  const addMedicine = useMutation({
    mutationFn: async (medicineData) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      
      setIsUploading(true);
      try {
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "medicine",
          ...medicineData,
          timestamp: new Date().toISOString()
        });

        // Add medicine on-chain with IPFS hash and price
        const priceWei = ethers.parseEther(medicineData.price.toString());
        const tx = await signerContract.addMedicine(ipfsUrl, priceWei);
        await tx.wait();
        
        return { ipfsUrl, price: medicineData.price };
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      setToast({ type: "success", message: "Medicine added successfully!" });
      // Reset form
      setFormData({
        name: "",
        dosageForm: "",
        strength: "",
        manufacturer: "",
        batch: "",
        expiry: "",
        description: "",
        storage: [],
        regulatoryId: "",
        ingredients: [],
        price: ""
      });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to add medicine." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    
    const medicineData = {
      name: form.get("name"),
      dosageForm: form.get("dosageForm"),
      strength: form.get("strength"),
      manufacturer: form.get("manufacturer"),
      batch: form.get("batch"),
      expiry: form.get("expiry"),
      description: form.get("description"),
      storage: formData.storage.join(". "),
      regulatoryId: form.get("regulatoryId"),
      ingredients: formData.ingredients,
      price: parseFloat(form.get("price"))
    };

    addMedicine.mutate(medicineData);
  };

  const addIngredient = () => {
    const ingredient = prompt("Enter ingredient name:");
    if (ingredient && ingredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredient.trim()]
      }));
    }
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Add Medicine</h2>
          <p>Access denied. Connect with the admin wallet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>Add New Medicine</h2>
        <p>Add a new medicine to the HealthcareLite catalog with complete details.</p>
        
        <form className="form-grid" onSubmit={handleSubmit}>
          <InputField
            name="name"
            label="Medicine Name"
            placeholder="Amoxicillin"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <SelectField
            name="dosageForm"
            label="Dosage Form"
            options={DOSAGE_FORMS.map(form => ({ value: form, label: form.charAt(0).toUpperCase() + form.slice(1) }))}
            value={formData.dosageForm}
            onChange={(e) => setFormData(prev => ({ ...prev, dosageForm: e.target.value }))}
            required
          />

          <InputField
            name="strength"
            label="Strength"
            placeholder="500 mg"
            value={formData.strength}
            onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
            required
          />

          <InputField
            name="manufacturer"
            label="Manufacturer"
            placeholder="Acme Pharma"
            value={formData.manufacturer}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
            required
          />

          <InputField
            name="batch"
            label="Batch Number"
            placeholder="AMX-0425"
            value={formData.batch}
            onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
            required
          />

          <InputField
            name="expiry"
            label="Expiry Date"
            type="date"
            value={formData.expiry}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
            required
          />

          <InputField
            name="regulatoryId"
            label="Regulatory ID"
            placeholder="CDSCO-IND-2025-00123"
            value={formData.regulatoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, regulatoryId: e.target.value }))}
            required
          />

          <InputField
            name="price"
            label="Price (ETH)"
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.001"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            required
          />

          <div className="form-group form-full-width">
            <label htmlFor="description">Description</label>
            <textarea
              name="description"
              id="description"
              placeholder="Antibiotic. Use only if prescribed."
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Storage Conditions</label>
            <div className="checkbox-grid">
              {STORAGE_CONDITIONS.map(condition => (
                <label key={condition} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.storage.includes(condition)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          storage: [...prev.storage, condition]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          storage: prev.storage.filter(s => s !== condition)
                        }));
                      }
                    }}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group form-full-width">
            <div className="ingredients-header">
              <label>Ingredients</label>
              <button type="button" onClick={addIngredient} className="secondary-btn">
                Add Ingredient
              </button>
            </div>
            {formData.ingredients.length > 0 && (
              <div className="ingredients-list">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-item">
                    <span>{ingredient}</span>
                    <button 
                      type="button" 
                      onClick={() => removeIngredient(index)}
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
            disabled={addMedicine.isPending || isUploading}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : addMedicine.isPending
              ? "Adding Medicine..."
              : "Add Medicine"}
          </button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          duration={4000}
        />
      )}
    </section>
  );
}