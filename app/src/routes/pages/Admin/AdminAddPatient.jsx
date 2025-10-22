import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../../../lib/ipfs.js";
import "./Admin.css";

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

const createPatientFormState = () => ({
  walletAddress: "",
  name: "",
  country: "IN",
  city: "",
  timezone: "Asia/Kolkata",
  email: "",
  ageRange: "",
  bloodGroup: "",
  allergies: [],
  conditions: [],
  emergencyContact: ""
});

export default function AdminAddPatient() {
  const navigate = useNavigate();
  const { signerContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState(() => createPatientFormState());
  const formRef = useRef(null);

  const addPatient = useMutation({
    mutationFn: async ({ photoFile, ...patientData }) => {
      if (!signerContract) throw new Error("Connect your wallet before adding a patient.");
      
      setIsUploading(true);
      try {
        let photoMetadata;
        if (photoFile && photoFile.size > 0) {
          photoMetadata = await uploadFileToIPFS(photoFile);
        }
        
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "patient",
          ...patientData,
          photo: photoMetadata ? {
            cid: photoMetadata.cid,
            ipfsUrl: photoMetadata.ipfsUrl,
            gatewayUrl: photoMetadata.gatewayUrl,
            name: photoMetadata.name
          } : undefined,
          timestamp: new Date().toISOString(),
          addedByAdmin: true,
          consent: true // Admin consent on behalf
        });

        // Register patient with their wallet address (admin registration)
        const tx = await signerContract.registerPatient(ipfsUrl, patientData.walletAddress);
        await tx.wait();
        
        return ipfsUrl;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      setToast({ type: "success", message: "Patient added successfully! Redirecting to manage patients..." });
      setFormData(createPatientFormState());
      formRef.current?.reset();
      
      setTimeout(() => {
        navigate("/admin/patients");
      }, 2000);
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to add patient." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const walletAddress = form.get("walletAddress");
    const photoCandidate = form.get("photo");
    const photoFile = photoCandidate instanceof File && photoCandidate.size > 0 ? photoCandidate : null;

    if (!ethers.isAddress(walletAddress)) {
      setToast({ type: "error", message: "Enter a valid wallet address starting with 0x." });
      return;
    }

    const patientData = {
      walletAddress,
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
      conditions: formData.conditions
    };

    addPatient.mutate({ ...patientData, photoFile });
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Add New Patient</h2>
          <p>Add a patient to the system using their wallet address.</p>
        </div>
        <div className="page-actions">
          <button onClick={() => navigate("/admin/patients")} className="btn-secondary">
            ← Back to Patients
          </button>
        </div>
      </div>

      <div className="panel">
        <form className="form-grid" onSubmit={handleSubmit} ref={formRef}>
          <InputField
            name="walletAddress"
            label="Patient's Wallet Address"
            placeholder="0xabc123..."
            required
          />

          <InputField
            name="name"
            label="Full Name"
            placeholder="Ravi P"
            required
          />

          <div className="form-group">
            <label htmlFor="photo">Profile Photo</label>
            <input
              className="form-input"
              type="file"
              name="photo"
              id="photo"
              accept="image/*"
            />
            <span className="form-helper">Optional. Supports JPG, PNG or GIF under 5&nbsp;MB.</span>
          </div>

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
            <div className="admin-consent-notice">
              <p><strong>Admin Note:</strong> By adding this patient, you are providing consent on their behalf for storing health information securely on IPFS within the HealthcareLite network.</p>
            </div>
          </div>

          <button
            type="submit"
            className="btn-add form-full-width"
            disabled={addPatient.isPending || isUploading}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : addPatient.isPending
              ? "Adding Patient..."
              : "Add Patient"}
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