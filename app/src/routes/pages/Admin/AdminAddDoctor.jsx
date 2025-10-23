import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadJSONToIPFS, uploadFileToIPFS } from "../../../lib/ipfs.js";
import "./Admin.css";

const SPECIALTIES = [
  "Cardiology", "Internal Medicine", "Pediatrics", "Orthopedics", 
  "Dermatology", "Neurology", "Psychiatry", "General Surgery",
  "Oncology", "Radiology", "Anesthesiology", "Emergency Medicine"
];

const DEGREES = [
  "MBBS", "MD", "MS", "DNB", "DM", "MCh", "BAMS", "BHMS", "BDS", "MDS", 
  "BPT", "MPT", "B.Pharm", "M.Pharm", "PhD", "Fellowship"
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "India", "Indonesia", "Iran", "Iraq", "Italy", "Japan", "Jordan", "Kenya", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Philippines", "Poland", "Russia", "Saudi Arabia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

const createDoctorFormState = () => ({
  walletAddress: "",
  name: "",
  specialties: [],
  degrees: [],
  country: "India",
  city: "",
  address: "",
  timezone: "Asia/Kolkata",
  dateOfBirth: "",
  experienceYears: "",
  languages: [],
  bio: "",
  email: "",
  licenseNumber: "",
  licenseIssuer: "",
  hospitalName: "",
  affiliations: "",
  availability: []
});

export default function AdminAddDoctor() {
  const navigate = useNavigate();
  const { signerContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef(null);
  const [formData, setFormData] = useState(() => createDoctorFormState());

  const addDoctor = useMutation({
    mutationFn: async ({ photoFile, ...doctorData }) => {
      if (!signerContract) throw new Error("Connect your wallet before adding a doctor.");
      
      setIsUploading(true);
      try {
        let photoMetadata;
        if (photoFile && photoFile.size > 0) {
          photoMetadata = await uploadFileToIPFS(photoFile);
        }
        
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "doctor",
          ...doctorData,
          photo: photoMetadata ? {
            cid: photoMetadata.cid,
            ipfsUrl: photoMetadata.ipfsUrl,
            gatewayUrl: photoMetadata.gatewayUrl,
            name: photoMetadata.name
          } : undefined,
          timestamp: new Date().toISOString(),
          addedByAdmin: true
        });

        // Register doctor with their wallet address (admin registration)
        const tx = await signerContract.registerDoctor(ipfsUrl, doctorData.walletAddress);
        await tx.wait();
        
        return ipfsUrl;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      setToast({ type: "success", message: "Doctor added successfully! Redirecting to manage doctors..." });
      setFormData(createDoctorFormState());
      formRef.current?.reset();
      
      setTimeout(() => {
        navigate("/admin/doctors");
      }, 2000);
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to add doctor." })
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
    
    const doctorData = {
      walletAddress,
      name: form.get("name"),
      specialties: formData.specialties,
      degrees: formData.degrees,
      dateOfBirth: form.get("dateOfBirth"),
      age: calculateAge(form.get("dateOfBirth")),
      location: {
        country: form.get("country"),
        city: form.get("city"),
        address: form.get("address"),
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
      hospitalInfo: {
        name: form.get("hospitalName"),
        affiliations: form.get("affiliations")
      }
    };

    addDoctor.mutate({ ...doctorData, photoFile });
  };

  const addAvailability = () => {
    setFormData(prev => ({
      ...prev,
      availability: [...prev.availability, { days: ["Mon"], from: "09:00", to: "17:00" }]
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
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Add New Doctor</h2>
          <p>Add a doctor to the system using their wallet address.</p>
        </div>
        <div className="page-actions">
          <button onClick={() => navigate("/admin/doctors")} className="btn-secondary">
            ← Back to Doctors
          </button>
        </div>
      </div>

      <div className="panel">
        <form className="form-grid" onSubmit={handleSubmit} ref={formRef}>
          <InputField
            name="walletAddress"
            label="Doctor's Wallet Address"
            placeholder="0xabc123..."
            required
          />

          <InputField
            name="name"
            label="Full Name"
            placeholder="Dr. A. Sharma"
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

          <div className="form-group">
            <label>Degrees</label>
            <div className="checkbox-grid">
              {DEGREES.map(degree => (
                <label key={degree} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.degrees.includes(degree)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          degrees: [...prev.degrees, degree]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          degrees: prev.degrees.filter(d => d !== degree)
                        }));
                      }
                    }}
                  />
                  {degree}
                </label>
              ))}
            </div>
          </div>

          <InputField
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            required
            max={new Date().toISOString().split('T')[0]}
          />

          <SelectField
            name="country"
            label="Country"
            options={COUNTRIES}
            required
          />

          <InputField
            name="city"
            label="City"
            placeholder="Indore"
            required
          />

          <InputField
            name="address"
            label="Address"
            placeholder="Complete address"
            required
          />

          <InputField
            name="hospitalName"
            label="Hospital Name"
            placeholder="City Hospital"
            required
          />

          <InputField
            name="affiliations"
            label="Hospital Affiliations (Hospital ID)"
            placeholder="Hospital registration ID or affiliation details"
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

          <div className="form-group form-full-width">
            <div className="availability-header">
              <label>Availability</label>
              <button type="button" onClick={addAvailability} className="btn-secondary">
                Add Schedule
              </button>
            </div>
            {formData.availability.map((slot, index) => (
              <div key={index} className="availability-row">
                <div className="availability-days">
                  <label>Days:</label>
                  <div className="checkbox-grid-inline">
                    {DAYS.map(day => (
                      <label key={day} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={slot.days ? slot.days.includes(day) : false}
                          onChange={(e) => {
                            const currentDays = slot.days || [];
                            if (e.target.checked) {
                              updateAvailability(index, 'days', [...currentDays, day]);
                            } else {
                              updateAvailability(index, 'days', currentDays.filter(d => d !== day));
                            }
                          }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="time-inputs">
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
                </div>
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
            className="btn-add form-full-width"
            disabled={addDoctor.isPending || isUploading}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : addDoctor.isPending
              ? "Adding Doctor..."
              : "Add Doctor"}
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