import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import { DOSAGE_FORMS, STORAGE_CONDITIONS } from "../../../lib/medicineConstants.js";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchMedicineRequests } from "../../../lib/queries.js";
import Toast from "../../../components/Toast/Toast.jsx";
import "../../../components/Forms/Form.css";
import "../../../components/Tables/Table.css";
import "../../../components/Toast/Toast.css";
import "./RequestMedicine.css";

export default function RequestMedicine() {
  const queryClient = useQueryClient();
  const { role, doctorId, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const isDoctor = role === ROLES.DOCTOR;

  const requestsQuery = useQuery({
    queryKey: ["doctor", "medicine-requests"],
    enabled: isDoctor && !!readonlyContract,
    queryFn: () => fetchMedicineRequests(readonlyContract)
  });

  const requests = useMemo(() => {
    const list = requestsQuery.data || [];
    if (!doctorId) return list;
    return list.filter((item) => Number(item.doctorId) === Number(doctorId));
  }, [requestsQuery.data, doctorId]);

  const submitMutation = useMutation({
    mutationFn: async ({ metadataCid }) => {
      if (!signerContract) throw new Error("Connect your wallet as an approved doctor.");
      const tx = await signerContract.submitMedicineRequest(metadataCid);
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "medicine-requests"] });
      setToast({ type: "success", message: "Request submitted to admin." });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to submit request." })
  });

  if (!isDoctor) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Request Medicine</h2>
          <p>You must connect with a registered doctor wallet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Request New Medicine</h2>
          <p>Submit inventory suggestions to the admin with detailed metadata pinned to IPFS.</p>
        </div>
      </header>

      <section className="panel">
        <h3>Create Request</h3>
        <MedicineRequestForm
          loading={loading || submitMutation.isPending}
          onSubmit={async (payload) => {
            try {
              setLoading(true);
              const { imageFile, ...rest } = payload;
              let imageUpload = null;
              if (imageFile) {
                imageUpload = await uploadFileToIPFS(imageFile);
              }

              const metadata = {
                ...rest,
                doctorId,
                createdAt: new Date().toISOString(),
                image: imageUpload?.ipfsUrl || imageUpload?.cid || null
              };
              const metadataUpload = await uploadJSONToIPFS(metadata);
              const metadataCid = metadataUpload.ipfsUrl || metadataUpload.cid;
              if (!metadataCid) {
                throw new Error("Unable to pin metadata to IPFS.");
              }
              await submitMutation.mutateAsync({ metadataCid });
            } catch (error) {
              console.error("Request submission failed", error);
              setToast({ type: "error", message: error.message || "Failed to prepare request." });
            } finally {
              setLoading(false);
            }
          }}
        />
      </section>

      <section className="panel">
        <h3>Submitted Requests</h3>
        {requestsQuery.isLoading ? (
          <p>Loading…</p>
        ) : requests.length === 0 ? (
          <p>No requests submitted yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicine</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id || request.metadataCid}>
                  <td>{formatEntityId("REQ", request.id || 0)}</td>
                  <td>{request.metadata?.medicineName || request.metadata?.name || "Unnamed"}</td>
                  <td>{request.metadata?.requestReason || "—"}</td>
                  <td>{request.processed ? "Processed" : "Pending"}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <a
                      href={request.metadataCid ? `https://ipfs.io/ipfs/${request.metadataCid.replace(/^ipfs:\/\//, "")}` : "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="view-profile-btn"
                    >
                      View IPFS
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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

function MedicineRequestForm({ loading, onSubmit }) {
  const [formData, setFormData] = useState({
    medicineName: "",
    genericName: "",
    manufacturer: "",
    description: "",
    dosageForm: "",
    strength: "",
    batch: "",
    expiry: "",
    regulatoryId: "",
    price: "",
    stock: "",
    storage: [],
    requestReason: "",
    urgencyLevel: "normal",
    imageFile: null
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStorage = (condition) => {
    setFormData((prev) => {
      const exists = prev.storage.includes(condition);
      const nextStorage = exists
        ? prev.storage.filter((item) => item !== condition)
        : [...prev.storage, condition];
      return { ...prev, storage: nextStorage };
    });
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        if (!formData.medicineName.trim()) {
          onSubmit?.(null);
          return;
        }
        onSubmit?.({
          ...formData,
          price: Number(formData.price) || 0,
          stock: Number(formData.stock) || 0
        });
        setFormData({
          medicineName: "",
          genericName: "",
          manufacturer: "",
          description: "",
          dosageForm: "",
          strength: "",
          batch: "",
          expiry: "",
          regulatoryId: "",
          price: "",
          stock: "",
          storage: [],
          requestReason: "",
          urgencyLevel: "normal",
          imageFile: null
        });
        event.currentTarget.reset();
      }}
    >
      <div className="form-field">
        <span className="form-label">Medicine Name</span>
        <input
          className="form-input"
          name="medicineName"
          required
          value={formData.medicineName}
          onChange={handleChange}
          placeholder="e.g. Amoxicillin"
        />
      </div>
      <div className="form-field">
        <span className="form-label">Generic Name</span>
        <input
          className="form-input"
          name="genericName"
          value={formData.genericName}
          onChange={handleChange}
        />
      </div>
      <div className="form-field">
        <span className="form-label">Manufacturer</span>
        <input
          className="form-input"
          name="manufacturer"
          value={formData.manufacturer}
          onChange={handleChange}
        />
      </div>
      <div className="form-field">
        <span className="form-label">Dosage Form</span>
        <select
          className="form-input"
          name="dosageForm"
          value={formData.dosageForm}
          onChange={handleChange}
        >
          <option value="">Select</option>
          {DOSAGE_FORMS.map((form) => (
            <option key={form} value={form}>
              {form}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <span className="form-label">Strength</span>
        <input
          className="form-input"
          name="strength"
          value={formData.strength}
          onChange={handleChange}
          placeholder="e.g. 500mg"
        />
      </div>
      <div className="form-field">
        <span className="form-label">Batch</span>
        <input
          className="form-input"
          name="batch"
          value={formData.batch}
          onChange={handleChange}
        />
      </div>
      <div className="form-field">
        <span className="form-label">Expiry Date</span>
        <input
          className="form-input"
          type="date"
          name="expiry"
          value={formData.expiry}
          onChange={handleChange}
        />
      </div>
      <div className="form-field">
        <span className="form-label">Regulatory ID</span>
        <input
          className="form-input"
          name="regulatoryId"
          value={formData.regulatoryId}
          onChange={handleChange}
        />
      </div>
      <div className="form-field">
        <span className="form-label">Price (ETH)</span>
        <input
          className="form-input"
          name="price"
          type="number"
          min="0"
          step="0.0001"
          value={formData.price}
          onChange={handleChange}
        />
      </div>
      <div className="form-field">
        <span className="form-label">Desired Stock</span>
        <input
          className="form-input"
          name="stock"
          type="number"
          min="0"
          step="1"
          value={formData.stock}
          onChange={handleChange}
        />
      </div>
      <div className="form-field" style={{ gridColumn: "1 / -1" }}>
        <span className="form-label">Description</span>
        <textarea
          className="form-input"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Clinical notes, indications, etc."
        />
      </div>
      <div className="form-field" style={{ gridColumn: "1 / -1" }}>
        <span className="form-label">Storage Conditions</span>
        <div className="storage-grid">
          {STORAGE_CONDITIONS.map((condition) => (
            <label key={condition} className="storage-chip">
              <input
                type="checkbox"
                checked={formData.storage.includes(condition)}
                onChange={() => toggleStorage(condition)}
              />
              <span>{condition}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-field" style={{ gridColumn: "1 / -1" }}>
        <span className="form-label">Request Reason</span>
        <textarea
          className="form-input"
          name="requestReason"
          rows={3}
          value={formData.requestReason}
          onChange={handleChange}
          placeholder="Explain why this medicine is needed"
        />
      </div>
      <div className="form-field">
        <span className="form-label">Urgency</span>
        <select
          className="form-input"
          name="urgencyLevel"
          value={formData.urgencyLevel}
          onChange={handleChange}
        >
          <option value="normal">Normal</option>
          <option value="priority">Priority</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div className="form-field">
        <span className="form-label">Image (optional)</span>
        <input className="form-input" type="file" accept="image/*" onChange={handleFile} />
      </div>
      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}



