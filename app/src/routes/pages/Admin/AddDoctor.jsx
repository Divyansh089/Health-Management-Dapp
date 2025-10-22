import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import InputField from "../../../components/Forms/InputField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { ROLES } from "../../../lib/constants.js";

export default function AddDoctor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role, signerContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    walletAddress: "",
    name: "",
    specialty: "",
    qualification: "",
    experience: "",
    email: "",
    phone: "",
    hospital: "",
    address: "",
    city: "",
    country: ""
  });

  const isAdmin = role === ROLES.ADMIN;

  const addDoctor = useMutation({
    mutationFn: async (doctorData) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      
      setIsUploading(true);
      try {
        // Upload JSON metadata to IPFS
        const { ipfsUrl } = await uploadJSONToIPFS({
          type: "doctor",
          ...doctorData,
          timestamp: new Date().toISOString(),
          addedByAdmin: true
        });

        // Register doctor on-chain with admin function
        const tx = await signerContract.adminRegisterDoctor(doctorData.walletAddress, ipfsUrl);
        await tx.wait();
        
        return { ipfsUrl, walletAddress: doctorData.walletAddress };
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "doctors"] });
      setToast({ type: "success", message: `Doctor added successfully! Wallet: ${data.walletAddress}` });
      
      // Reset form
      setFormData({
        walletAddress: "",
        name: "",
        specialty: "",
        qualification: "",
        experience: "",
        email: "",
        phone: "",
        hospital: "",
        address: "",
        city: "",
        country: ""
      });
      formRef.current?.reset();
      
      // Redirect to doctors page after a short delay
      setTimeout(() => {
        navigate("/admin/doctors");
      }, 2000);
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to add doctor." })
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    
    const doctorData = {
      walletAddress: form.get("walletAddress"),
      name: form.get("name"),
      specialty: form.get("specialty"),
      qualification: form.get("qualification"),
      experience: parseInt(form.get("experience")),
      email: form.get("email"),
      phone: form.get("phone"),
      hospital: form.get("hospital"),
      address: form.get("address"),
      city: form.get("city"),
      country: form.get("country")
    };

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(doctorData.walletAddress)) {
      setToast({ type: "error", message: "Please enter a valid wallet address (0x...)" });
      return;
    }

    addDoctor.mutate(doctorData);
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Add Doctor by Wallet</h2>
          <p>Access denied. Connect with the admin wallet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>Add Doctor by Wallet Address</h2>
        <p>Register a new doctor directly using their wallet address. The wallet holder will be able to connect and access the doctor dashboard immediately.</p>
        
        <form className="form-grid" onSubmit={handleSubmit} ref={formRef}>
          <InputField
            name="walletAddress"
            label="Doctor's Wallet Address"
            placeholder="0x1234567890123456789012345678901234567890"
            value={formData.walletAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
            required
          />

          <InputField
            name="name"
            label="Full Name"
            placeholder="Dr. John Smith"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <InputField
            name="specialty"
            label="Medical Specialty"
            placeholder="Cardiology"
            value={formData.specialty}
            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
            required
          />

          <InputField
            name="qualification"
            label="Qualification"
            placeholder="MBBS, MD Cardiology"
            value={formData.qualification}
            onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
            required
          />

          <InputField
            name="experience"
            label="Years of Experience"
            type="number"
            min="0"
            placeholder="5"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            required
          />

          <InputField
            name="email"
            label="Email Address"
            type="email"
            placeholder="doctor@hospital.com"
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
            name="hospital"
            label="Hospital/Clinic"
            placeholder="General Hospital"
            value={formData.hospital}
            onChange={(e) => setFormData(prev => ({ ...prev, hospital: e.target.value }))}
            required
          />

          <InputField
            name="address"
            label="Address"
            placeholder="123 Medical Street"
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

          <button
            type="submit"
            className="primary-btn form-full-width"
            disabled={addDoctor.isPending || isUploading}
          >
            {isUploading
              ? "Uploading to IPFS..."
              : addDoctor.isPending
              ? "Adding Doctor..."
              : "Add Doctor"}
          </button>
        </form>

        <div className="panel-note">
          <p><strong>Note:</strong> The doctor will need to connect with the specified wallet address to access their dashboard. Make sure the wallet address is correct and belongs to the intended doctor.</p>
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