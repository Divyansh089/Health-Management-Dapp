import React, { useState, useEffect } from 'react';
import { fetchFromIPFS } from '../../lib/ipfs.js';
import './Modal.css';

export default function DoctorProfileModal({ doctor, isOpen, onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && doctor?.ipfs) {
      loadDoctorProfile();
    }
  }, [isOpen, doctor]);

  const loadDoctorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract CID from IPFS URL
      const cid = doctor.ipfs.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '');
      
      try {
        // Try to fetch actual data from IPFS
        const actualData = await fetchFromIPFS(cid);
        
        if (actualData && actualData.type === 'doctor') {
          // Transform the actual IPFS data to display format
          const profileData = {
            name: actualData.name || 'Unknown Doctor',
            specialty: actualData.specialties ? actualData.specialties.join(', ') : 'Not specified',
            qualification: 'Medical Professional', // Could be enhanced with actual qualification data
            experience: actualData.experienceYears ? `${actualData.experienceYears} years` : 'Not specified',
            hospital: 'Healthcare Provider', // Could be enhanced with actual hospital data
            phone: 'Contact via platform', // For privacy
            email: actualData.contact?.email || 'Not provided',
            availability: actualData.availability || [],
            languages: actualData.languages || [],
            consultationFee: 'Contact for rates',
            bio: actualData.bio || 'No bio provided',
            address: actualData.location ? `${actualData.location.city}, ${actualData.location.country}` : 'Not provided',
            // Additional fields from actual data
            city: actualData.location?.city || 'Not specified',
            country: actualData.location?.country || 'Not specified',
            timezone: actualData.location?.timezone || 'Not specified',
            licenseNumber: actualData.license?.number || 'Not provided',
            licenseIssuer: actualData.license?.issuer || 'Not provided',
            website: actualData.links?.website || null,
            registrationDate: actualData.timestamp ? new Date(actualData.timestamp).toLocaleDateString() : 'Unknown'
          };
          
          setProfileData(profileData);
          return;
        }
      } catch (ipfsError) {
        console.warn('Failed to fetch from IPFS, using fallback data:', ipfsError);
      }
      
      // Fallback to mock data if IPFS fetch fails
      const mockProfile = {
        name: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
        specialty: ['Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics'][Math.floor(Math.random() * 5)],
        qualification: 'MBBS, MD',
        experience: '8 years',
        hospital: 'City General Hospital',
        phone: '+1 (555) 123-4567',
        email: 'doctor@hospital.com',
        availability: [
          { day: 'Monday', time: '9:00 AM - 5:00 PM' },
          { day: 'Tuesday', time: '9:00 AM - 5:00 PM' },
          { day: 'Wednesday', time: '9:00 AM - 5:00 PM' },
          { day: 'Thursday', time: '9:00 AM - 5:00 PM' },
          { day: 'Friday', time: '9:00 AM - 5:00 PM' }
        ],
        languages: ['English', 'Spanish'],
        consultationFee: '$150',
        bio: 'Profile data temporarily unavailable. This is mock display data.',
        address: '123 Medical Center Drive, City, State 12345'
      };

      setProfileData(mockProfile);
    } catch (err) {
      setError('Failed to load doctor profile');
      console.error('Error loading doctor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👨‍⚕️ Doctor Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading doctor profile...</p>
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
              {profileData.bio && profileData.bio.includes('temporarily unavailable') && (
                <div className="data-source-notice">
                  ℹ️ <strong>Note:</strong> This profile shows sample data. The actual IPFS data could not be retrieved at this time.
                </div>
              )}
              
              <div className="profile-header">
                <div className="profile-avatar">
                  👨‍⚕️
                </div>
                <div className="profile-basic">
                  <h3>{profileData.name}</h3>
                  <p className="specialty">{profileData.specialty}</p>
                  <p className="qualification">{profileData.qualification}</p>
                </div>
                <div className="profile-status">
                  <span className={`status-badge ${doctor.approved ? 'approved' : 'pending'}`}>
                    {doctor.approved ? '✅ Approved' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              <div className="profile-sections">
                <div className="profile-section">
                  <h4>📋 Professional Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Experience:</strong>
                      <span>{profileData.experience}</span>
                    </div>
                    <div className="info-item">
                      <strong>Specialties:</strong>
                      <span>{profileData.specialty}</span>
                    </div>
                    <div className="info-item">
                      <strong>Languages:</strong>
                      <span>{profileData.languages?.length > 0 ? profileData.languages.join(', ') : 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <strong>License Number:</strong>
                      <span>{profileData.licenseNumber}</span>
                    </div>
                    <div className="info-item">
                      <strong>License Issuer:</strong>
                      <span>{profileData.licenseIssuer}</span>
                    </div>
                    <div className="info-item">
                      <strong>Registration Date:</strong>
                      <span>{profileData.registrationDate}</span>
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
                    {profileData.website && (
                      <div className="info-item full-width">
                        <strong>Website:</strong>
                        <span>{profileData.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-section">
                  <h4>⏰ Availability</h4>
                  <div className="availability-grid">
                    {profileData.availability?.length > 0 ? (
                      profileData.availability.map((slot, index) => (
                        <div key={index} className="availability-item">
                          <strong>{slot.day}:</strong>
                          <span>{slot.from} - {slot.to}</span>
                        </div>
                      ))
                    ) : (
                      <div className="availability-item">
                        <span>No availability schedule provided</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-section">
                  <h4>📊 Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{doctor.appointments}</div>
                      <div className="stat-label">Total Appointments</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{doctor.successes}</div>
                      <div className="stat-label">Successful Treatments</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {doctor.appointments > 0 
                          ? Math.round((doctor.successes / doctor.appointments) * 100) + '%'
                          : '—'
                        }
                      </div>
                      <div className="stat-label">Success Rate</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">#{doctor.id}</div>
                      <div className="stat-label">Doctor ID</div>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>📝 Biography</h4>
                  <p className="bio">{profileData.bio}</p>
                </div>

                <div className="profile-section">
                  <h4>🔗 Blockchain Information</h4>
                  <div className="blockchain-info">
                    <div className="info-item">
                      <strong>Wallet Address:</strong>
                      <span className="wallet-address">{doctor.account}</span>
                    </div>
                    <div className="info-item">
                      <strong>IPFS Profile:</strong>
                      <span className="ipfs-link">{doctor.ipfs}</span>
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