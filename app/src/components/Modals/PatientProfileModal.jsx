import React, { useState, useEffect } from 'react';
import { fetchFromIPFS } from '../../lib/ipfs.js';
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
      
      // Extract CID from IPFS URL
      const cid = patient.ipfs.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '');
      
      try {
        // Try to fetch actual data from IPFS
        const actualData = await fetchFromIPFS(cid);
        
        if (actualData && actualData.type === 'patient') {
          // Transform the actual IPFS data to display format
          const profileData = {
            name: actualData.name || 'Unknown Patient',
            age: actualData.demographics?.age || 'Not specified',
            gender: actualData.demographics?.gender || 'Not specified',
            bloodGroup: actualData.medicalProfile?.bloodGroup || 'Not specified',
            phone: 'Contact via platform', // For privacy
            email: actualData.contact?.email || 'Not provided',
            emergencyContact: actualData.emergencyContact || {
              name: 'Not provided',
              phone: 'Not provided',
              relation: 'Not provided'
            },
            medicalHistory: actualData.medicalProfile?.medicalHistory || [],
            currentMedications: actualData.medicalProfile?.currentMedications || [],
            allergies: actualData.medicalProfile?.allergies || [],
            chronicConditions: actualData.medicalProfile?.chronicConditions || [],
            lastCheckup: 'Not available',
            height: actualData.medicalProfile?.height || 'Not specified',
            weight: actualData.medicalProfile?.weight || 'Not specified',
            bmi: 'Not calculated',
            address: actualData.location ? `${actualData.location.city}, ${actualData.location.country}` : 'Not provided',
            insuranceProvider: actualData.insurance?.provider || 'Not provided',
            policyNumber: actualData.insurance?.policyNumber || 'Not provided',
            // Additional fields from actual data
            city: actualData.location?.city || 'Not specified',
            country: actualData.location?.country || 'Not specified',
            timezone: actualData.location?.timezone || 'Not specified',
            registrationDate: actualData.timestamp ? new Date(actualData.timestamp).toLocaleDateString() : 'Unknown',
            consent: actualData.consent || false,
            submittedWallet: actualData.walletAddress || null
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
        gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        phone: '+1 (555) 987-6543',
        email: 'patient@email.com',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+1 (555) 111-2222',
          relation: 'Spouse'
        },
        medicalHistory: [
          'Hypertension (2020)',
          'Diabetes Type 2 (2019)',
          'Allergic to Penicillin'
        ],
        currentMedications: [
          'Metformin 500mg - Twice daily',
          'Lisinopril 10mg - Once daily'
        ],
        allergies: ['Penicillin', 'Shellfish', 'Pollen'],
        chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        lastCheckup: '2025-09-15',
        height: '5\'8"',
        weight: '165 lbs',
        bmi: '25.1',
        address: '456 Patient Street, City, State 67890',
        insuranceProvider: 'HealthCare Plus',
        policyNumber: 'HCP-123456789',
        submittedWallet: null
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
              {profileData.name && profileData.name.startsWith('Patient ') && (
                <div className="data-source-notice">
                  ℹ️ <strong>Note:</strong> This profile shows sample data. The actual IPFS data could not be retrieved at this time.
                </div>
              )}
              
              <div className="profile-header">
                <div className="profile-avatar">
                  👤
                </div>
                <div className="profile-basic">
                  <h3>{profileData.name}</h3>
                  <p className="specialty">{profileData.age} years old • {profileData.gender}</p>
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
                      <span>{profileData.age} years</span>
                    </div>
                    <div className="info-item">
                      <strong>Gender:</strong>
                      <span>{profileData.gender}</span>
                    </div>
                    <div className="info-item">
                      <strong>Blood Group:</strong>
                      <span>{profileData.bloodGroup}</span>
                    </div>
                    <div className="info-item">
                      <strong>Height:</strong>
                      <span>{profileData.height}</span>
                    </div>
                    <div className="info-item">
                      <strong>Weight:</strong>
                      <span>{profileData.weight}</span>
                    </div>
                    <div className="info-item">
                      <strong>BMI:</strong>
                      <span>{profileData.bmi}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>📞 Contact & Location</h4>
                  <div className="info-grid">
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
                    <div className="info-item">
                      <strong>Name:</strong>
                      <span>{profileData.emergencyContact.name}</span>
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong>
                      <span>{profileData.emergencyContact.phone}</span>
                    </div>
                    <div className="info-item">
                      <strong>Relation:</strong>
                      <span>{profileData.emergencyContact.relation}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>🏥 Medical History</h4>
                  <div className="medical-list">
                    {profileData.medicalHistory?.length > 0 ? (
                      profileData.medicalHistory.map((item, index) => (
                        <div key={index} className="medical-item">
                          📋 {item}
                        </div>
                      ))
                    ) : (
                      <div className="medical-item">
                        📋 No medical history provided
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-section">
                  <h4>💊 Current Medications</h4>
                  <div className="medical-list">
                    {profileData.currentMedications?.length > 0 ? (
                      profileData.currentMedications.map((med, index) => (
                        <div key={index} className="medical-item">
                          💊 {med}
                        </div>
                      ))
                    ) : (
                      <div className="medical-item">
                        💊 No current medications listed
                      </div>
                    )}
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
                      <strong>Chronic Conditions:</strong>
                      <div className="tag-list">
                        {profileData.chronicConditions?.length > 0 ? (
                          profileData.chronicConditions.map((condition, index) => (
                            <span key={index} className="condition-tag">
                              🏥 {condition}
                            </span>
                          ))
                        ) : (
                          <span>No chronic conditions listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>🏥 Healthcare Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Last Checkup:</strong>
                      <span>{new Date(profileData.lastCheckup).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <strong>Insurance Provider:</strong>
                      <span>{profileData.insuranceProvider}</span>
                    </div>
                    <div className="info-item full-width">
                      <strong>Policy Number:</strong>
                      <span>{profileData.policyNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>🔗 Blockchain Information</h4>
                  <div className="blockchain-info">
                    <div className="info-item">
                      <strong>Patient ID:</strong>
                      <span>#{patient.id}</span>
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