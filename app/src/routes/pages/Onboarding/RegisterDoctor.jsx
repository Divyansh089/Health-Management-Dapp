import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadJSONToIPFS, uploadFileToIPFS } from "../../../lib/ipfs.js";
import "./Onboarding.css";

const SPECIALTIES = [
  "Cardiology", "Internal Medicine", "Pediatrics", "Orthopedics", 
  "Dermatology", "Neurology", "Psychiatry", "General Surgery",
  "Oncology", "Radiology", "Anesthesiology", "Emergency Medicine"
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RegisterDoctor() {
  const { signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    specialties: [],
    country: "IN",
    city: "",
    timezone: "Asia/Kolkata",
    experienceYears: "",
    languages: [],
    bio: "",
    email: "",
    licenseNumber: "",
    licenseIssuer: "",
    website: "",
    availability: []
  });

  const feeQuery = useQuery({
    queryKey: ["onboard", "doctor-fee"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      const fee = await readonlyContract.doctorRegFeeWei();
      return {
        wei: fee,
        eth: Number(ethers.formatEther(fee))
      };
    }
  });

  const registerDoctor = useMutation({
    mutationFn: async (doctorData) => {
      if (!signerContract) throw new Error("Connect your wallet before registering.");
      
      setIsUploading(true);
      try {
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "doctor",
          ...doctorData,
          timestamp: new Date().toISOString()
        });

        // Register on-chain with IPFS hash
        const tx = await signerContract.registerDoctor(ipfsUrl, { value: feeQuery.data.wei });
        await tx.wait();
        
        return ipfsUrl;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => setToast({ type: "success", message: "Registration submitted. Await approval." }),
    onError: (error) => setToast({ type: "error", message: error.message || "Registration failed." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    
    const doctorData = {
      name: form.get("name"),
      specialties: formData.specialties,
      location: {
        country: form.get("country"),
        city: form.get("city"),
        timezone: form.get("timezone")
      },
      experienceYears: parseInt(form.get("experienceYears")),
      languages: formData.languages,
      bio: form.get("bio"),
      availability: formData.availability,
      contact: {
        email: form.get("email")
      },
      license: {
        number: form.get("licenseNumber"),
        issuer: form.get("licenseIssuer")
      },
      links: {
        website: form.get("website") || undefined
      }
    };

    registerDoctor.mutate(doctorData);
  };

  const addAvailability = () => {
    setFormData(prev => ({
      ...prev,
      availability: [...prev.availability, { day: "Mon", from: "09:00", to: "17:00" }]
    }));
  };

  const updateAvailability = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeAvailability = (index) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  return (
    <section className="onboard-page">
      <div className="panel">
        <h2>Doctor Registration</h2>
        <p>
          Complete your professional profile to join HealthcareLite. Admin approval is required
          before you can prescribe medicines.
        </p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <InputField
            name="name"
            label="Full Name"
            placeholder="Dr. A. Sharma"
            required
          />
          
          <div className="form-group">
            <label>Specialties</label>
            <div className="checkbox-grid">
              {SPECIALTIES.map(specialty => (
                <label key={specialty} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          specialties: [...prev.specialties, specialty]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          specialties: prev.specialties.filter(s => s !== specialty)
                        }));
                      }
                    }}
                  />
                  {specialty}
                </label>
              ))}
            </div>
          </div>

          <InputField
            name="city"
            label="City"
            placeholder="Indore"
            required
          />

          <InputField
            name="experienceYears"
            label="Years of Experience"
            type="number"
            min="0"
            max="50"
            required
          />

          <div className="form-group">
            <label>Languages</label>
            <div className="checkbox-grid">
              {LANGUAGES.map(language => (
                <label key={language} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.languages.includes(language)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          languages: [...prev.languages, language]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          languages: prev.languages.filter(l => l !== language)
                        }));
                      }
                    }}
                  />
                  {language}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group form-full-width">
            <label htmlFor="bio">Professional Bio</label>
            <textarea
              name="bio"
              id="bio"
              placeholder="Consultant cardiologist focused on prevention..."
              rows="3"
              required
            />
          </div>

          <InputField
            name="email"
            label="Email"
            type="email"
            placeholder="doctor@example.com"
            required
          />

          <InputField
            name="licenseNumber"
            label="Medical License Number"
            placeholder="MCI-12345"
            required
          />

          <InputField
            name="licenseIssuer"
            label="License Issuer"
            placeholder="Medical Council of India"
            required
          />

          <InputField
            name="website"
            label="Website (Optional)"
            type="url"
            placeholder="https://drsharma.example"
          />

          <div className="form-group form-full-width">
            <div className="availability-header">
              <label>Availability</label>
              <button type="button" onClick={addAvailability} className="secondary-btn">
                Add Schedule
              </button>
            </div>
            {formData.availability.map((slot, index) => (
              <div key={index} className="availability-row">
                <select
                  value={slot.day}
                  onChange={(e) => updateAvailability(index, 'day', e.target.value)}
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.from}
                  onChange={(e) => updateAvailability(index, 'from', e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  value={slot.to}
                  onChange={(e) => updateAvailability(index, 'to', e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => removeAvailability(index)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="primary-btn form-full-width"
            disabled={registerDoctor.isPending || isUploading || !feeQuery.data}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : registerDoctor.isPending
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