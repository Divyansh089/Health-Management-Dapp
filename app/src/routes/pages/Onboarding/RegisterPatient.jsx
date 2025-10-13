import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import "./Onboarding.css";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const AGE_RANGES = ["0-17", "18-25", "26-35", "36-45", "46-55", "56-65", "65+"];

const COMMON_ALLERGIES = [
  "Penicillin", "Aspirin", "Peanuts", "Shellfish", "Eggs", "Milk", 
  "Soy", "Wheat", "Fish", "Tree nuts", "Latex", "Pollen"
];

const COMMON_CONDITIONS = [
  "Diabetes", "Hypertension", "Asthma", "Heart Disease", "Arthritis",
  "Thyroid Disorders", "High Cholesterol", "Kidney Disease", "Liver Disease",
  "Mental Health Conditions", "Autoimmune Disorders"
];

export default function RegisterPatient() {
  const { signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "IN",
    city: "",
    timezone: "Asia/Kolkata",
    email: "",
    ageRange: "",
    bloodGroup: "",
    allergies: [],
    conditions: [],
    emergencyContact: "",
    consent: false
  });

  const feeQuery = useQuery({
    queryKey: ["onboard", "patient-fee"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      const fee = await readonlyContract.patientRegFeeWei();
      return {
        wei: fee,
        eth: Number(ethers.formatEther(fee))
      };
    }
  });

  const registerPatient = useMutation({
    mutationFn: async (patientData) => {
      if (!signerContract) throw new Error("Connect your wallet before registering.");
      
      setIsUploading(true);
      try {
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "patient",
          ...patientData,
          timestamp: new Date().toISOString()
        });

        // Register on-chain with IPFS hash
        const tx = await signerContract.registerPatient(ipfsUrl, { value: feeQuery.data.wei });
        await tx.wait();
        
        return ipfsUrl;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () =>
      setToast({ type: "success", message: "Welcome! You can now book appointments." }),
    onError: (error) => setToast({ type: "error", message: error.message || "Registration failed." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    
    if (!formData.consent) {
      setToast({ type: "error", message: "Please provide consent to proceed." });
      return;
    }

    const patientData = {
      name: form.get("name"),
      location: {
        country: form.get("country"),
        city: form.get("city"),
        timezone: form.get("timezone")
      },
      contact: {
        email: form.get("email"),
        emergency: form.get("emergencyContact")
      },
      profile: {
        ageRange: form.get("ageRange"),
        bloodGroup: form.get("bloodGroup")
      },
      allergies: formData.allergies,
      conditions: formData.conditions,
      consent: formData.consent
    };

    registerPatient.mutate(patientData);
  };

  return (
    <section className="onboard-page">
      <div className="panel">
        <h2>Patient Registration</h2>
        <p>Create your secure health profile to book appointments and manage your medical records.</p>
        
        <form className="form-grid" onSubmit={handleSubmit}>
          <InputField
            name="name"
            label="Full Name"
            placeholder="Ravi P"
            required
          />

          <InputField
            name="city"
            label="City"
            placeholder="Bhopal"
            required
          />

          <InputField
            name="email"
            label="Email"
            type="email"
            placeholder="ravi@example.com"
            required
          />

          <SelectField
            name="ageRange"
            label="Age Range"
            options={AGE_RANGES.map(range => ({ value: range, label: range }))}
            required
          />

          <SelectField
            name="bloodGroup"
            label="Blood Group"
            options={BLOOD_GROUPS.map(group => ({ value: group, label: group }))}
            required
          />

          <InputField
            name="emergencyContact"
            label="Emergency Contact"
            placeholder="Phone number or email"
            required
          />

          <div className="form-group">
            <label>Known Allergies</label>
            <div className="checkbox-grid">
              {COMMON_ALLERGIES.map(allergy => (
                <label key={allergy} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.allergies.includes(allergy)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          allergies: [...prev.allergies, allergy]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          allergies: prev.allergies.filter(a => a !== allergy)
                        }));
                      }
                    }}
                  />
                  {allergy}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Medical Conditions</label>
            <div className="checkbox-grid">
              {COMMON_CONDITIONS.map(condition => (
                <label key={condition} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes(condition)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          conditions: [...prev.conditions, condition]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          conditions: prev.conditions.filter(c => c !== condition)
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
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                required
              />
              <span>
                I consent to storing my health information securely on IPFS and understand that 
                this data will be used for medical coordination within the HealthcareLite network.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="primary-btn form-full-width"
            disabled={registerPatient.isPending || isUploading || !feeQuery.data || !formData.consent}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : registerPatient.isPending
              ? "Submitting..."
              : `Register (${feeQuery.data?.eth?.toFixed(4) ?? "…"} ETH)`}
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