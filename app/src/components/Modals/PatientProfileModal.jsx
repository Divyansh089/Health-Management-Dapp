import React, { useState, useEffect } from 'react';
import { fetchFromIPFS } from '../../lib/ipfs.js';
import { formatEntityId } from '../../lib/format.js';
import './Modal.css';

export default function PatientProfileModal({ patient, isOpen, onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && patient?.ipfs) {
      loadPatientProfile();
    }
  }, [isOpen, patient]);

  const loadPatientProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch actual data from IPFS (accepts ipfs://, gateway URLs, or raw CID)
      const cidOrUrl = patient.ipfs;
      try {
        // Try to fetch actual data from IPFS
        const actualData = await fetchFromIPFS(cidOrUrl);
        
        if (actualData && actualData.type === 'patient') {
          // Transform the actual IPFS data to display format
          const profileData = {
            name: actualData.name || 'Unknown Patient',
            age: actualData.profile?.age ?? 'Not provided',
            bloodGroup: actualData.profile?.bloodGroup || 'Not provided',
            email: actualData.contact?.email || 'Not provided',
            emergencyContact: actualData.contact?.emergency || 'Not provided',
            allergies: Array.isArray(actualData.allergies) ? actualData.allergies : [],
            conditions: Array.isArray(actualData.conditions) ? actualData.conditions : [],
            address: actualData.location?.address || 'Not provided',
            city: actualData.location?.city || 'Not specified',
            country: actualData.location?.country || 'Not specified',
            timezone: actualData.location?.timezone || 'Not specified',
            registrationDate: actualData.timestamp ? new Date(actualData.timestamp).toLocaleDateString() : 'Unknown',
            consent: Boolean(actualData.consent),
            submittedWallet: actualData.walletAddress || null,
            photoUrl: actualData.photo?.gatewayUrl || actualData.photo?.ipfsUrl || null,
            isMock: false
          };

          setProfileData(profileData);
          return;
        }
      } catch (ipfsError) {
        console.warn('Failed to fetch from IPFS, using fallback data:', ipfsError);
      }
      
      // Fallback to mock data if IPFS fetch fails
      const mockProfile = {
        name: `Patient ${['Alex', 'Sarah', 'Michael', 'Emma', 'James'][Math.floor(Math.random() * 5)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][Math.floor(Math.random() * 5)]}`,
        age: Math.floor(Math.random() * 40) + 25,
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        email: 'patient@email.com',
        emergencyContact: '+1 (555) 111-2222',
        allergies: ['Penicillin', 'Shellfish', 'Pollen'],
        conditions: ['Hypertension', 'Type 2 Diabetes'],
        address: '456 Health Street',
        city: 'Sample City',
        country: 'Sample Country',
        timezone: 'Asia/Kolkata',
        registrationDate: new Date().toLocaleDateString(),
        consent: false,
        submittedWallet: null,
        photoUrl: null,
        isMock: true
      };

      setProfileData(mockProfile);
    } catch (err) {
      setError('Failed to load patient profile');
      console.error('Error loading patient profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Patient Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading patient profile...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h3>Profile Not Available</h3>
              <p>{error}</p>
            </div>
          )}

          {profileData && (
            <div className="profile-content">
              {profileData.isMock && (
                <div className="data-source-notice">
                  ℹ️ <strong>Note:</strong> This profile shows sample data. The actual IPFS data could not be retrieved at this time.
                </div>
              )}
              
              <div className="profile-header">
                <div className="profile-avatar">
                  {profileData.photoUrl ? (
                    <img src={profileData.photoUrl} alt={profileData.name} />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="profile-basic">
                  <h3>{profileData.name}</h3>
                  <p className="specialty">
                    Age: {profileData.age === 'Not provided' ? 'Not provided' : `${profileData.age} years`}
                  </p>
                  <p className="qualification">Blood Group: {profileData.bloodGroup}</p>
                </div>
                <div className="profile-status">
                  <span className="status-badge approved">
                    ✅ Registered Patient
                  </span>
                </div>
              </div>

              <div className="profile-sections">
                <div className="profile-section">
                  <h4>📋 Personal Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Age:</strong>
                      <span>{profileData.age === 'Not provided' ? 'Not provided' : `${profileData.age} years`}</span>
                    </div>
                    <div className="info-item">
                      <strong>Blood Group:</strong>
                      <span>{profileData.bloodGroup}</span>
                    </div>
                    <div className="info-item">
                      <strong>Consent:</strong>
                      <span>{profileData.consent ? 'Granted' : 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>📞 Contact & Location</h4>
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <strong>Address:</strong>
                      <span>{profileData.address}</span>
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong>
                      <span>{profileData.email}</span>
                    </div>
                    <div className="info-item">
                      <strong>City:</strong>
                      <span>{profileData.city}</span>
                    </div>
                    <div className="info-item">
                      <strong>Country:</strong>
                      <span>{profileData.country}</span>
                    </div>
                    <div className="info-item">
                      <strong>Timezone:</strong>
                      <span>{profileData.timezone}</span>
                    </div>
                    <div className="info-item">
                      <strong>Registration Date:</strong>
                      <span>{profileData.registrationDate}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>🚨 Emergency Contact</h4>
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <strong>Primary Contact:</strong>
                      <span>{profileData.emergencyContact}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>⚠️ Allergies & Conditions</h4>
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <strong>Allergies:</strong>
                      <div className="tag-list">
                        {profileData.allergies?.length > 0 ? (
                          profileData.allergies.map((allergy, index) => (
                            <span key={index} className="allergy-tag">
                              ⚠️ {allergy}
                            </span>
                          ))
                        ) : (
                          <span>No allergies listed</span>
                        )}
                      </div>
                    </div>
                    <div className="info-item full-width">
                      <strong>Conditions:</strong>
                      <div className="tag-list">
                        {profileData.conditions?.length > 0 ? (
                          profileData.conditions.map((condition, index) => (
                            <span key={index} className="condition-tag">
                              🏥 {condition}
                            </span>
                          ))
                        ) : (
                          <span>No conditions listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>🔗 Blockchain Information</h4>
                  <div className="blockchain-info">
                    <div className="info-item">
                      <strong>Patient ID:</strong>
                      <span className="wallet-address">{patient.humanId || formatEntityId('PAT', patient.id)}</span>
                    </div>
                    {profileData.submittedWallet && (
                      <div className="info-item">
                        <strong>Submitted Wallet:</strong>
                        <span className="wallet-address">{profileData.submittedWallet}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <strong>Wallet Address:</strong>
                      <span className="wallet-address">{patient.account}</span>
                    </div>
                    <div className="info-item full-width">
                      <strong>IPFS Profile:</strong>
                      <span className="ipfs-link">{patient.ipfs}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}