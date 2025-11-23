import React, { useState, useEffect, useCallback } from 'react';
import { fetchFromIPFS } from '../../lib/ipfs.js';
import { formatEntityId } from '../../lib/format.js';
import './Modal.css';

// Country to timezone mapping
const getTimezoneByCountry = (country) => {
  const timezoneMap = {
    'India': 'Asia/Kolkata',
    'United States': 'America/New_York',
    'United Kingdom': 'Europe/London',
    'Canada': 'America/Toronto',
    'Australia': 'Australia/Sydney',
    'Germany': 'Europe/Berlin',
    'France': 'Europe/Paris',
    'Japan': 'Asia/Tokyo',
    'China': 'Asia/Shanghai',
    'Brazil': 'America/Sao_Paulo',
    'Mexico': 'America/Mexico_City',
    'Russia': 'Europe/Moscow',
    'South Africa': 'Africa/Johannesburg',
    'UAE': 'Asia/Dubai',
    'Singapore': 'Asia/Singapore',
    'Malaysia': 'Asia/Kuala_Lumpur',
    'Thailand': 'Asia/Bangkok',
    'Indonesia': 'Asia/Jakarta',
    'Philippines': 'Asia/Manila',
    'Pakistan': 'Asia/Karachi',
    'Bangladesh': 'Asia/Dhaka',
    'Egypt': 'Africa/Cairo',
    'Nigeria': 'Africa/Lagos',
    'Kenya': 'Africa/Nairobi',
    'Argentina': 'America/Argentina/Buenos_Aires',
    'Chile': 'America/Santiago',
    'Colombia': 'America/Bogota',
    'Spain': 'Europe/Madrid',
    'Italy': 'Europe/Rome',
    'Netherlands': 'Europe/Amsterdam',
    'Sweden': 'Europe/Stockholm',
    'Norway': 'Europe/Oslo',
    'Denmark': 'Europe/Copenhagen',
    'Finland': 'Europe/Helsinki',
    'Poland': 'Europe/Warsaw',
    'Turkey': 'Europe/Istanbul',
    'Saudi Arabia': 'Asia/Riyadh',
    'South Korea': 'Asia/Seoul',
    'Vietnam': 'Asia/Ho_Chi_Minh',
    'New Zealand': 'Pacific/Auckland'
  };
  return timezoneMap[country] || 'UTC';
};

export default function DoctorProfileModal({ doctor, isOpen, onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Robustly extract CID or HTTP gateway path
  const extractCid = useCallback((uri) => {
    if (!uri) return null;
    const s = String(uri);
    if (s.startsWith('ipfs://')) return s.slice(7);
    if (s.includes('/ipfs/')) return s.split('/ipfs/')[1];
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (isOpen && doctor?.ipfs) {
        await loadDoctorProfile(cancelled);
      } else if (isOpen && !doctor?.ipfs) {
        setProfileData(null);
        setError('No IPFS profile set for this doctor');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, doctor]);

  // Lock background scroll while modal open and enable Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const loadDoctorProfile = async (cancelledFlag = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract CID from IPFS URL
      const cid = extractCid(doctor.ipfs);
      
      try {
        // Try to fetch actual data from IPFS
        const actualData = await fetchFromIPFS(cid);
        
        if (actualData && actualData.type === 'doctor') {
          // Transform the actual IPFS data to display format
          const profileData = {
            name: actualData.name || 'Unknown Doctor',
            specialty: actualData.specialties ? actualData.specialties.join(', ') : 'Not specified',
            qualification: actualData.degrees ? actualData.degrees.join(', ') : 'Medical Professional',
            experience: (actualData.experienceYears !== undefined && actualData.experienceYears !== null && actualData.experienceYears !== '') ? `${actualData.experienceYears} years` : 'Not specified',
            hospital: 'Healthcare Provider', // Could be enhanced with actual hospital data
            phone: 'Contact via platform', // For privacy
            email: actualData.contact?.email || 'Not provided',
            availability: actualData.availability || [],
            languages: actualData.languages || [],
            consultationFee: 'Contact for rates',
            bio: actualData.bio || 'No bio provided',
            address: actualData.location ? `${actualData.location.city}, ${actualData.location.country}` : 'Not provided',
            // Additional fields from actual data
            city: actualData.city || actualData.location?.city || 'Not specified',
            country: actualData.country || actualData.location?.country || 'Not specified',
            timezone: actualData.timezone || (actualData.country ? getTimezoneByCountry(actualData.country) : (actualData.location?.country ? getTimezoneByCountry(actualData.location.country) : 'Not specified')),
            licenseNumber: actualData.license?.number || 'Not provided',
            licenseIssuer: actualData.license?.issuer || 'Not provided',
            website: actualData.links?.website || null,
            registrationDate: actualData.timestamp ? new Date(actualData.timestamp).toLocaleDateString() : 'Unknown',
            submittedWallet: actualData.walletAddress || null,
            photoUrl: actualData.photo?.gatewayUrl || actualData.photo?.ipfsUrl || null
          };
          
          if (!cancelledFlag) setProfileData(profileData);
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
          { day: 'Monday', from: '9:00 AM', to: '5:00 PM' },
          { day: 'Tuesday', from: '9:00 AM', to: '5:00 PM' },
          { day: 'Wednesday', from: '9:00 AM', to: '5:00 PM' },
          { day: 'Thursday', from: '9:00 AM', to: '5:00 PM' },
          { day: 'Friday', from: '9:00 AM', to: '5:00 PM' }
        ],
        languages: ['English', 'Spanish'],
        consultationFee: '$150',
        bio: 'Profile data temporarily unavailable. This is mock display data.',
        address: '123 Medical Center Drive, City, State 12345',
        submittedWallet: null,
        photoUrl: null
      };

      if (!cancelledFlag) setProfileData(mockProfile);
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
                  {profileData.photoUrl ? (
                    <img src={profileData.photoUrl} alt={profileData.name} />
                  ) : (
                    '👨‍⚕️'
                  )}
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
                      profileData.availability.map((slot, index) => {
                        // Handle availability format: { days: ["Mon", "Tue"], from: "09:00", to: "17:00" }
                        const daysText = slot.days && Array.isArray(slot.days) && slot.days.length > 0 
                          ? slot.days.join(', ') 
                          : (slot.day || slot.dayOfWeek || `Schedule ${index + 1}`);
                        const timeText = slot.time || 
                                       (slot.from && slot.to ? `${slot.from} - ${slot.to}` : null) ||
                                       (slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : null);
                        return (
                          <div key={index} className="availability-item">
                            <strong>{daysText}:</strong>
                            <span>{timeText || 'Available'}</span>
                          </div>
                        );
                      })
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
                      <div className="stat-value">{doctor.humanId || formatEntityId('DOC', doctor.id)}</div>
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
                      <strong>Doctor ID:</strong>
                      <span className="wallet-address">{doctor.humanId || formatEntityId('DOC', doctor.id)}</span>
                    </div>
                    <div className="info-item">
                      <strong>Doctor Wallet Address:</strong>
                      <span className="wallet-address">{doctor.account}</span>
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