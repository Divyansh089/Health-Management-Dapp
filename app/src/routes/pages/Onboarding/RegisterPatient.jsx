import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../../../lib/ipfs.js";
import "./Onboarding.css";

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
  name: "",
  country: "India",
  city: "",
  timezone: "Asia/Kolkata",
  email: "",
  dateOfBirth: "",
  bloodGroup: "",
  mobile: "",
  address: "",
  currentMedications: "",
  allergies: [],
  conditions: [],
  emergencyContact: "",
  consent: false
});

export default function RegisterPatient() {
  const navigate = useNavigate();
  const { signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState(() => createPatientFormState());
  const formRef = useRef(null);

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
    mutationFn: async ({ photoFile, ...patientData }) => {
      if (!signerContract) throw new Error("Connect your wallet before registering.");
      
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
          timestamp: new Date().toISOString()
        });

        // Register on-chain with IPFS hash
        // Pass address(0) for self-registration
        const tx = await signerContract.registerPatient(ipfsUrl, ethers.ZeroAddress, { value: feeQuery.data.wei });
        await tx.wait();
        
        return ipfsUrl;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      setToast({ type: "success", message: "Welcome! Redirecting to patient dashboard..." });
      setFormData(createPatientFormState());
      formRef.current?.reset();
      
      // Redirect to patient dashboard after a short delay
      setTimeout(() => {
        navigate("/patient");
      }, 2000);
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Registration failed." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const walletAddress = form.get("walletAddress");
    const photoCandidate = form.get("photo");
    const photoFile = photoCandidate instanceof File && photoCandidate.size > 0 ? photoCandidate : null;
    
    if (!formData.consent) {
      setToast({ type: "error", message: "Please provide consent to proceed." });
      return;
    }

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
        mobile: form.get("mobile")
      },
      profile: {
        dateOfBirth: dateOfBirth,
        age: calculatedAge,
        bloodGroup: form.get("bloodGroup")
      },
      allergies: formData.allergies,
      conditions: formData.conditions,
      currentMedications: form.get("currentMedications") || "",
      consent: formData.consent
    };

    registerPatient.mutate({ ...patientData, photoFile });
  };

  return (
    <section className="onboard-page">
      <div className="panel">
        <h2>Patient Registration</h2>
        <p>Create your secure health profile to book appointments and manage your medical records.</p>
        
  <form className="form-grid" onSubmit={handleSubmit} ref={formRef}>
          <InputField
            name="name"
            label="Full Name"
            placeholder="Ravi P"
            required
          />

          <InputField
            name="walletAddress"
            label="Wallet Address"
            placeholder="0xabc123..."
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
            name="mobile"
            label="Mobile N0."
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
              placeholder="List any medications you are currently taking..."
              rows="3"
            />
            <span className="form-helper">Optional. List any medications, supplements, or treatments you're currently using.</span>
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
              : "Register"}
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