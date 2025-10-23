import { useRef, useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { ROLES } from "../../../lib/constants.js";
import { DOSAGE_FORMS, STORAGE_CONDITIONS } from "../../../lib/medicineConstants.js";

export default function AddMedicine() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role, signerContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef(null);
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
    price: "",
    stock: ""
  });

  const isAdmin = role === ROLES.ADMIN;

  const addMedicine = useMutation({
    mutationFn: async ({ photoFile, ...medicineData }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      
      setIsUploading(true);
      try {
        let photoMetadata;
        if (photoFile && photoFile.size > 0) {
          photoMetadata = await uploadFileToIPFS(photoFile);
        }
        // Upload JSON metadata to IPFS
        const numericPrice = Number(medicineData.price);
        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
          throw new Error("Price must be a non-negative number.");
        }

        const numericStock = Number(medicineData.stock);
        if (!Number.isFinite(numericStock) || numericStock < 0) {
          throw new Error("Stock must be a non-negative number.");
        }

        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "medicine",
          ...medicineData,
          price: numericPrice,
          stock: numericStock,
          image: photoMetadata ? {
            cid: photoMetadata.cid,
            ipfsUrl: photoMetadata.ipfsUrl,
            gatewayUrl: photoMetadata.gatewayUrl,
            name: photoMetadata.name
          } : undefined,
          timestamp: new Date().toISOString()
        });

        // Add medicine on-chain with IPFS hash and price
        const priceWei = ethers.parseEther(numericPrice.toString());
        const stockUnits = Math.trunc(numericStock);
        const tx = await signerContract.addMedicine(ipfsUrl, priceWei, stockUnits);
        await tx.wait();
        
        return { ipfsUrl, price: numericPrice };
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
        price: "",
        stock: ""
      });
      formRef.current?.reset();
      
      // Redirect to medicines page after a short delay to show the success message
      setTimeout(() => {
        navigate("/admin/medicines");
      }, 1500);
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to add medicine." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const photoCandidate = form.get("photo");
    const photoFile = photoCandidate instanceof File && photoCandidate.size > 0 ? photoCandidate : null;
    
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
      price: parseFloat(form.get("price")),
      stock: parseInt(form.get("stock"), 10)
    };

    addMedicine.mutate({ ...medicineData, photoFile });
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
        
  <form className="form-grid" onSubmit={handleSubmit} ref={formRef}>
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

          <InputField
            name="stock"
            label="Initial Stock (units)"
            type="number"
            step="1"
            min="0"
            placeholder="100"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
            required
          />

          <div className="form-group">
            <label htmlFor="photo">Medicine Image</label>
            <input
              className="form-input"
              type="file"
              name="photo"
              id="photo"
              accept="image/*"
            />
            <span className="form-helper">Optional. Include product packshot (JPG/PNG/GIF).</span>
          </div>

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