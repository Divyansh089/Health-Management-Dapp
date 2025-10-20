import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import Toast from "../../../components/Toast/Toast.jsx";
import "../../../components/Tables/Table.css";
import "../../../components/Toast/Toast.css";
import { MEDICINE_REQUESTS_EVENT, getMedicineRequests, updateMedicineRequest } from "../../../lib/medicineRequests.js";
import { fetchFromIPFS } from "../../../lib/ipfs.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { useSearch } from "../../../state/SearchContext.jsx";
import "./Admin.css";

export default function MedicineRequests() {
  const { signerContract } = useWeb3();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { query, setPlaceholder, clearQuery } = useSearch();

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const loadMedicineRequests = () => {
    try {
      setLoading(true);
      const existing = getMedicineRequests();
      setRequests(existing);
      if (existing.length) {
        setSelectedRequest((prev) => prev && existing.some((item) => item.id === prev.id)
          ? existing.find((item) => item.id === prev.id) || existing[0]
          : existing[0]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error loading medicine requests:", error);
      showToastMessage("Failed to load medicine requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, medicineName, ipfsCid) => {
    if (!signerContract) {
      showToastMessage('Connect the admin wallet to approve medicine requests.', 'error');
      return;
    }
    try {
      setProcessing(requestId);
      
      // Fetch full medicine data from IPFS
      const medicineData = await fetchFromIPFS(ipfsCid);
      
      const priceValue = Number(medicineData.price);
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        throw new Error('Invalid price in submitted metadata.');
      }

      const stockValue = Number(medicineData.stock ?? medicineData.quantity ?? 0);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        throw new Error('Invalid stock in submitted metadata.');
      }

      const metadataPointer = ipfsCid.startsWith('ipfs://') ? ipfsCid : `ipfs://${ipfsCid}`;

      // Add medicine to contract
      const tx = await signerContract.addMedicine(
        metadataPointer,
        ethers.parseEther(priceValue.toString()),
        Math.trunc(stockValue)
      );
      
      await tx.wait();

      const updated = updateMedicineRequest(requestId, {
        status: "approved",
        processedAt: new Date().toISOString()
      });

      if (updated) {
        setRequests((prev) => prev.map((req) => (req.id === requestId ? updated : req)));
        setSelectedRequest((prev) => (prev && prev.id === requestId ? updated : prev));
      }
      showToastMessage(`Medicine "${medicineName}" approved and added to catalog!`);
    } catch (error) {
      console.error("Error approving medicine:", error);
      showToastMessage("Failed to approve medicine request: " + error.message, "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId, medicineName) => {
    try {
      setProcessing(requestId);
      
      const updated = updateMedicineRequest(requestId, {
        status: "rejected",
        processedAt: new Date().toISOString()
      });
      if (updated) {
        setRequests((prev) => prev.map((req) => (req.id === requestId ? updated : req)));
        setSelectedRequest((prev) => (prev && prev.id === requestId ? updated : prev));
      }
      showToastMessage(`Medicine request for "${medicineName}" rejected`);
    } catch (error) {
      console.error("Error rejecting medicine:", error);
      showToastMessage("Failed to reject medicine request", "error");
    } finally {
      setProcessing(null);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ff6b4a';
      case 'normal': return '#54a0ff';
      case 'low': return '#5f27cd';
      default: return '#54a0ff';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#2ed573';
      case 'rejected': return '#ff4757';
      case 'pending': return '#ffa502';
      default: return '#747d8c';
    }
  };

  useEffect(() => {
    loadMedicineRequests();
    if (typeof window !== "undefined") {
      const handler = (event) => {
        const nextRequests = event?.detail?.requests || getMedicineRequests();
        setRequests(nextRequests);
        if (nextRequests.length) {
          setSelectedRequest((prev) => prev && nextRequests.some((item) => item.id === prev.id)
            ? nextRequests.find((item) => item.id === prev.id) || nextRequests[0]
            : nextRequests[0]);
        } else {
          setSelectedRequest(null);
        }
      };
      window.addEventListener(MEDICINE_REQUESTS_EVENT, handler);
      return () => {
        window.removeEventListener(MEDICINE_REQUESTS_EVENT, handler);
      };
    }
  }, []);

  useEffect(() => {
    setPlaceholder('Search medicine requests');
    return () => {
      setPlaceholder();
      clearQuery();
    };
  }, [setPlaceholder, clearQuery]);

  const filteredRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((req) => {
      const fields = [
        req.doctorName,
        req.doctorAddress,
        req.medicineName,
        req.genericName,
        req.manufacturer,
        String(req.doctorId),
        formatEntityId('DOC', req.doctorId),
        req.status,
        req.urgencyLevel,
        req.ipfsCid
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return fields.some((value) => value.includes(term));
    });
  }, [requests, query]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading medicine requests...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const processedRequests = filteredRequests.filter(req => req.status !== 'pending');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💊 Medicine Requests</h1>
        <p>Review and approve medicine requests from doctors</p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="card">
          <h3>🔄 Pending Requests ({pendingRequests.length})</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Medicine Name</th>
                  <th>Request Date</th>
                  <th>Urgency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="doctor-info">
                        <strong>{request.doctorName}</strong>
                        <small>ID: {request.doctorId}</small>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setSelectedRequest(request)}
                      >
                        {request.medicineName}
                      </button>
                    </td>
                    <td>
                      {formatDate(request.requestDate) || '—'}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getUrgencyColor(request.urgencyLevel) }}
                      >
                        {request.urgencyLevel.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApprove(request.id, request.medicineName, request.ipfsCid)}
                          disabled={processing === request.id}
                          className="btn-approve"
                        >
                          {processing === request.id ? '⏳' : '✅'} Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.medicineName)}
                          disabled={processing === request.id}
                          className="btn-reject"
                        >
                          {processing === request.id ? '⏳' : '❌'} Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {processedRequests.length > 0 && (
        <div className="card">
          <h3>📋 Processed Requests ({processedRequests.length})</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Medicine Name</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="doctor-info">
                        <strong>{request.doctorName}</strong>
                        <small>ID: {request.doctorId}</small>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setSelectedRequest(request)}
                      >
                        {request.medicineName}
                      </button>
                    </td>
                    <td>
                      {formatDate(request.requestDate) || '—'}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getUrgencyColor(request.urgencyLevel) }}
                      >
                        {request.urgencyLevel.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <h3>No Medicine Requests</h3>
          <p>No medicine requests have been submitted yet.</p>
        </div>
      )}

      {requests.length > 0 && filteredRequests.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Matching Requests</h3>
          <p>No medicine requests match your search.</p>
        </div>
      )}

      {selectedRequest && (
        <div className="card">
          <h3>📝 Request Details</h3>
          <div className="details-grid">
            <div>
              <strong>Medicine Name</strong>
              <p>{selectedRequest.medicineName}</p>
            </div>
            <div>
              <strong>Generic Name</strong>
              <p>{selectedRequest.genericName || '—'}</p>
            </div>
            <div>
              <strong>Manufacturer</strong>
              <p>{selectedRequest.manufacturer || '—'}</p>
            </div>
            <div>
              <strong>Urgency</strong>
              <p>{selectedRequest.urgencyLevel?.toUpperCase?.() || 'NORMAL'}</p>
            </div>
            <div>
              <strong>Price</strong>
              <p>
                {selectedRequest.price !== null && selectedRequest.price !== '' && Number.isFinite(Number(selectedRequest.price))
                  ? `${Number(selectedRequest.price).toFixed(2)} ${selectedRequest.currency}`
                  : '—'}
              </p>
            </div>
            <div>
              <strong>Status</strong>
              <p>{selectedRequest.status?.toUpperCase?.() || 'PENDING'}</p>
            </div>
            <div>
              <strong>Doctor ID</strong>
              <p>{selectedRequest.doctorId ? formatEntityId('DOC', selectedRequest.doctorId) : '—'}</p>
            </div>
            <div>
              <strong>Doctor Wallet</strong>
              <p className="truncate">{selectedRequest.doctorAddress || '—'}</p>
            </div>
            <div>
              <strong>Strength</strong>
              <p>{selectedRequest.strength || '—'}</p>
            </div>
            <div>
              <strong>Dosage Form</strong>
              <p>{selectedRequest.dosageForm || '—'}</p>
            </div>
            <div>
              <strong>Therapeutic Class</strong>
              <p>{selectedRequest.therapeuticClass || '—'}</p>
            </div>
            <div>
              <strong>Approval Number</strong>
              <p>{selectedRequest.approvalNumber || '—'}</p>
            </div>
            <div>
              <strong>Expiry Date</strong>
              <p>{selectedRequest.expiryDate ? formatDate(selectedRequest.expiryDate) : '—'}</p>
            </div>
            <div>
              <strong>Batch Number</strong>
              <p>{selectedRequest.batchNumber || '—'}</p>
            </div>
            <div className="full-width">
              <strong>Reason</strong>
              <p>{selectedRequest.requestReason || 'No justification provided.'}</p>
            </div>
            {selectedRequest.activeIngredients?.length ? (
              <div className="full-width">
                <strong>Active Ingredients</strong>
                <ul className="pill-list">
                  {selectedRequest.activeIngredients.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selectedRequest.description ? (
              <div className="full-width">
                <strong>Description</strong>
                <p>{selectedRequest.description}</p>
              </div>
            ) : null}
          </div>

          <footer className="details-footer">
            <div>
              <small>Submitted: {formatDate(selectedRequest.requestDate) || '—'}</small>
            </div>
            {selectedRequest.ipfsCid && (
              <a
                className="link-button"
                href={`https://ipfs.io/ipfs/${selectedRequest.ipfsCid}`}
                target="_blank"
                rel="noreferrer"
              >
                View Metadata →
              </a>
            )}
          </footer>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={5000}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}