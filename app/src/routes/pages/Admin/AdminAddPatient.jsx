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

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "India", "Indonesia", "Iran", "Iraq", "Italy", "Japan", "Jordan", "Kenya", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Philippines", "Poland", "Russia", "Saudi Arabia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
];

const COMMON_ALLERGIES = [
  "Penicillin", "Aspirin", "Peanuts", "Shellfish", "Eggs", "Milk", 
  "Soy", "Wheat", "Fish", "Tree nuts", "Latex", "Pollen"
];

const COMMON_CONDITIONS = [
  "Diabetes", "Hypertension", "Asthma", "Heart Disease", "Arthritis",
  "Thyroid Disorders", "High Cholesterol", "Kidney Disease", "Liver Disease",
  "Mental Health Conditions", "Autoimmune Disorders"
];

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const createPatientFormState = () => ({
  walletAddress: "",
  name: "",
  country: "India",
  city: "",
  timezone: "Asia/Kolkata",
  email: "",
  dateOfBirth: "",
  bloodGroup: "",
  contractNumber: "",
  address: "",
  currentMedications: "",
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

    const dateOfBirth = form.get("dateOfBirth");
    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      setToast({ type: "error", message: "Date of birth cannot be in the future." });
      return;
    }

    const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : null;

    const patientData = {
      walletAddress,
      name: form.get("name"),
      location: {
        country: form.get("country"),
        city: form.get("city"),
        timezone: form.get("timezone"),
        address: form.get("address")
      },
      contact: {
        email: form.get("email"),
        emergency: form.get("emergencyContact"),
        contractNumber: form.get("contractNumber")
      },
      profile: {
        dateOfBirth: dateOfBirth,
        age: calculatedAge,
        bloodGroup: form.get("bloodGroup")
      },
      allergies: formData.allergies,
      conditions: formData.conditions,
      currentMedications: form.get("currentMedications") || ""
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

          <SelectField
            name="country"
            label="Country"
            options={COUNTRIES.map(country => ({ value: country, label: country }))}
            required
          />

          <InputField
            name="city"
            label="City"
            placeholder="Bhopal"
            required
          />

          <InputField
            name="address"
            label="Address"
            placeholder="123 Main Street, Apartment 4B"
            required
          />

          <InputField
            name="email"
            label="Email"
            type="email"
            placeholder="ravi@example.com"
            required
          />

          <InputField
            name="contractNumber"
            label="Contact Number"
            placeholder="+91 9876543210"
            required
          />

          <InputField
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
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

          <div className="form-group form-full-width">
            <label htmlFor="currentMedications">Current Medications (Optional)</label>
            <textarea
              name="currentMedications"
              id="currentMedications"
              placeholder="List any medications the patient is currently taking..."
              rows="3"
            />
            <span className="form-helper">Optional. List any medications, supplements, or treatments the patient is currently using.</span>
          </div>

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