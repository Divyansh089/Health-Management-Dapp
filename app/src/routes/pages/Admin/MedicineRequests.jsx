import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../state/Web3Provider.jsx';
import { fetchFromIPFS } from '../../../lib/ipfs.js';
import '../../../components/Tables/Table.css';
import '../../../components/Toast/Toast.css';
import Toast from '../../../components/Toast/Toast.jsx';
import './Admin.css';
import { useSearch } from '../../../state/SearchContext.jsx';

export default function MedicineRequests() {
  const { signerContract } = useWeb3();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const { query, setPlaceholder, clearQuery } = useSearch();

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const loadMedicineRequests = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - in production, this would come from contract events
      const mockRequests = [
        {
          id: 1,
          doctorId: 1,
          doctorName: 'Dr. Smith',
          medicineName: 'Paracetamol Plus',
          requestDate: '2025-10-13T10:30:00Z',
          status: 'pending',
          urgencyLevel: 'normal',
          ipfsCid: 'bafyreiexample1'
        },
        {
          id: 2,
          doctorId: 2,
          doctorName: 'Dr. Johnson',
          medicineName: 'Advanced Antibiotic',
          requestDate: '2025-10-12T14:20:00Z',
          status: 'pending',
          urgencyLevel: 'high',
          ipfsCid: 'bafyreiexample2'
        }
      ];

      setRequests(mockRequests);
    } catch (error) {
      console.error('Error loading medicine requests:', error);
      showToastMessage('Failed to load medicine requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, medicineName, ipfsCid) => {
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
      
      // Update request status locally
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' }
          : req
      ));
      
      showToastMessage(`Medicine "${medicineName}" approved and added to catalog!`);
    } catch (error) {
      console.error('Error approving medicine:', error);
      showToastMessage('Failed to approve medicine request: ' + error.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId, medicineName) => {
    try {
      setProcessing(requestId);
      
      // In a real implementation, you'd update the request status in the contract
      // For now, we'll just update locally
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' }
          : req
      ));
      
      showToastMessage(`Medicine request for "${medicineName}" rejected`);
    } catch (error) {
      console.error('Error rejecting medicine:', error);
      showToastMessage('Failed to reject medicine request', 'error');
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
        req.medicineName,
        String(req.doctorId),
        `doc-${String(req.doctorId).padStart(4, '0')}`,
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
                      <strong>{request.medicineName}</strong>
                    </td>
                    <td>
                      {new Date(request.requestDate).toLocaleDateString()}
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
                      <strong>{request.medicineName}</strong>
                    </td>
                    <td>
                      {new Date(request.requestDate).toLocaleDateString()}
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