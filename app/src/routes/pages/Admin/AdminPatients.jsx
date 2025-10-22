import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import PatientProfileModal from "../../../components/Modals/PatientProfileModal.jsx";
import { fetchPatients } from "../../../lib/queries.js";
import { formatEntityId } from "../../../lib/format.js";
import { fetchFromIPFS } from "../../../lib/ipfs.js";
import { useSearch } from "../../../state/SearchContext.jsx";
import "./Admin.css";

// Patient Avatar Component with IPFS image fallback
function PatientAvatar({ photoUrl, name, patientId, isLoading }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const getInitial = () => {
    if (name && name !== patientId) {
      return name.charAt(0).toUpperCase();
    }
    return patientId.charAt(0);
  };

  if (isLoading) {
    return (
      <div className="patient-avatar loading">
        <div className="avatar-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="patient-avatar">
      {photoUrl && !imageError ? (
        <div className="avatar-image-container">
          <img 
            src={photoUrl}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && (
            <span className="avatar-initial">
              {getInitial()}
            </span>
          )}
        </div>
      ) : (
        <span className="avatar-initial">
          {getInitial()}
        </span>
      )}
    </div>
  );
}

// Individual Patient List Item Component
function PatientListItem({ patient, isLoading, onViewProfile }) {
  const patientId = patient.humanId || formatEntityId("PAT", patient.id);
  
  return (
    <article className="patient-list-item">
      <PatientAvatar 
        photoUrl={patient.photoUrl}
        name={patient.displayName}
        patientId={patientId}
        isLoading={isLoading}
      />
      
      <div className="patient-main">
        <div className="patient-header">
          <div className="patient-info">
            <h3 className="patient-name">{patient.displayName}</h3>
            <div className="patient-meta">
              <span className="patient-id">ID: {patientId}</span>
              <span className="patient-age">Age: {patient.displayAge}</span>
            </div>
            <span className="patient-status active">Active</span>
          </div>
        </div>
        
        <div className="patient-details">
          <div className="detail-item">
            <span className="detail-label">Wallet Address</span>
            <span className="detail-value wallet-address">{patient.account}</span>
          </div>
          
          {patient.profileData && (
            <div className="detail-item">
              <span className="detail-label">Blood Group</span>
              <span className="detail-value">
                {patient.profileData.profile?.bloodGroup || 'Not provided'}
              </span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="detail-label">Profile Status</span>
            <span className="detail-value">
              {patient.hasProfileData ? (
                <span className="profile-available">✓ Complete Profile</span>
              ) : patient.ipfs ? (
                <span className="profile-partial">⚠ Profile Loading</span>
              ) : (
                <span className="profile-missing">✗ No Profile</span>
              )}
            </span>
          </div>
        </div>
      </div>
      
      <div className="patient-actions">
        {patient.ipfs ? (
          <button 
            onClick={onViewProfile}
            className="btn-view-profile"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'View Profile'}
          </button>
        ) : (
          <button className="btn-view-profile disabled" disabled>
            No Profile
          </button>
        )}
      </div>
    </article>
  );
}

export default function AdminPatients() {
  const { readonlyContract } = useWeb3();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientsWithProfiles, setPatientsWithProfiles] = useState([]);
  const [profileLoadingMap, setProfileLoadingMap] = useState({});
  const { query, setPlaceholder, clearQuery } = useSearch();

  useEffect(() => {
    setPlaceholder("Search patients by ID or wallet");
    return () => {
      setPlaceholder();
      clearQuery();
    };
  }, [setPlaceholder, clearQuery]);

  const patientsQuery = useQuery({
    queryKey: ["admin", "patients", readonlyContract?.target],
    enabled: !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  const patients = patientsQuery.data || [];

  // Fetch IPFS data for each patient
  useEffect(() => {
    if (patients.length > 0) {
      const fetchPatientsProfiles = async () => {
        const updatedPatients = await Promise.all(
          patients.map(async (patient) => {
            if (!patient.ipfs) {
              return {
                ...patient,
                profileData: null,
                displayName: formatEntityId("PAT", patient.id),
                displayAge: "Not provided",
                photoUrl: null,
                hasProfileData: false
              };
            }

            try {
              setProfileLoadingMap(prev => ({ ...prev, [patient.id]: true }));
              
              const cid = patient.ipfs.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '');
              const profileData = await fetchFromIPFS(cid);
              
              if (profileData && profileData.type === 'patient') {
                return {
                  ...patient,
                  profileData,
                  displayName: profileData.name || formatEntityId("PAT", patient.id),
                  displayAge: profileData.profile?.age ? `${profileData.profile.age} years` : "Not provided",
                  photoUrl: profileData.photo?.gatewayUrl || profileData.photo?.ipfsUrl || null,
                  hasProfileData: true
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch profile for patient ${patient.id}:`, error);
            } finally {
              setProfileLoadingMap(prev => ({ ...prev, [patient.id]: false }));
            }

            // Fallback if IPFS fetch fails
            return {
              ...patient,
              profileData: null,
              displayName: formatEntityId("PAT", patient.id),
              displayAge: "Not available",
              photoUrl: null,
              hasProfileData: false
            };
          })
        );
        
        setPatientsWithProfiles(updatedPatients);
      };

      fetchPatientsProfiles();
    }
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patientsWithProfiles;
    return patientsWithProfiles.filter((patient) => {
      const values = [
        patient.humanId, 
        patient.account, 
        patient.ipfs, 
        String(patient.id),
        patient.displayName,
        patient.profileData?.name
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return values.some((value) => value.includes(term));
    });
  }, [patientsWithProfiles, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Registered Patients</h2>
          <p>Review onboarded patients and their on-chain identifiers.</p>
        </div>
        <div className="page-actions">
          <a href="/admin/add-patient" className="btn-add">
            ➕ Add Patient by Wallet
          </a>
          <a href="/onboard/patient" className="btn-add secondary">
            👤 Self Registration Form
          </a>
        </div>
      </header>
      <div className="patient-list-container">
        {patientsQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="patient-list-item skeleton" />
          ))}
        {patientsQuery.isError && (
          <div className="empty-state">
            <p className="error-text">Unable to load patient registry.</p>
          </div>
        )}
        {!patientsQuery.isLoading && filteredPatients.length === 0 && (
          <div className="empty-state">
            <p>{hasQuery ? "No patients match your search." : "No patients registered yet."}</p>
          </div>
        )}
        {filteredPatients.map((patient) => (
          <PatientListItem 
            key={patient.id} 
            patient={patient}
            isLoading={profileLoadingMap[patient.id]}
            onViewProfile={() => setSelectedPatient(patient)}
          />
        ))}
      </div>

      <PatientProfileModal 
        patient={selectedPatient}
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </section>
  );
}
