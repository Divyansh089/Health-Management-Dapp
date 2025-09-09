import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index';
import '../styles/Doctors.css';
import { GET_ALL_APPROVE_DOCTORS } from '../../Context/constants';
import { FaUserMd, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap } from 'react-icons/fa';

function Doctors() {
  const { address } = useStateContext();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const doctorsList = await GET_ALL_APPROVE_DOCTORS();
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading doctors...</div>
      </div>
    );
  }

  return (
    <section id="doctors" style={sectionStyle}>
      <div style={headerStyle}>
        <h2>Our Verified Doctors</h2>
        <p>Only licensed and approved doctors can provide healthcare services here.</p>
      </div>
      
      {doctors.length === 0 ? (
        <div style={emptyStateStyle}>
          <FaUserMd style={{ fontSize: '48px', color: '#6c757d', marginBottom: '20px' }} />
          <h3>No Doctors Available</h3>
          <p>There are currently no approved doctors in the system.</p>
        </div>
      ) : (
        <div style={doctorsGridStyle}>
          {doctors.map((doctor) => (
            <div key={doctor.doctorID} style={doctorCardStyle}>
              <div style={doctorImageContainerStyle}>
                <img src={doctor.image} alt={doctor.firstName} style={doctorImageStyle} />
                <div style={statusBadgeStyle}>
                  <FaUserMd style={{ marginRight: '5px' }} />
                  Verified
                </div>
              </div>
              
              <div style={doctorInfoStyle}>
                <h3>{doctor.title} {doctor.firstName} {doctor.lastName}</h3>
                <p style={specializationStyle}>{doctor.specialization}</p>
                
                <div style={doctorDetailsStyle}>
                  <div style={detailItemStyle}>
                    <FaGraduationCap style={{ marginRight: '8px', color: '#007bff' }} />
                    <span>{doctor.degrer}</span>
                  </div>
                  
                  <div style={detailItemStyle}>
                    <FaEnvelope style={{ marginRight: '8px', color: '#007bff' }} />
                    <span>{doctor.emailID}</span>
                  </div>
                  
                  <div style={detailItemStyle}>
                    <FaPhone style={{ marginRight: '8px', color: '#007bff' }} />
                    <span>{doctor.mobile}</span>
                  </div>
                  
                  <div style={detailItemStyle}>
                    <FaMapMarkerAlt style={{ marginRight: '8px', color: '#007bff' }} />
                    <span>{doctor.yourAddress}</span>
                  </div>
                </div>
                
                <div style={statsStyle}>
                  <div style={statItemStyle}>
                    <span style={statNumberStyle}>{doctor.appointmentCount}</span>
                    <span style={statLabelStyle}>Appointments</span>
                  </div>
                  <div style={statItemStyle}>
                    <span style={statNumberStyle}>{doctor.successfulTreatmentCount}</span>
                    <span style={statLabelStyle}>Treatments</span>
                  </div>
                </div>
                
                <div style={biographyStyle}>
                  <h4>About</h4>
                  <p>{doctor.biography}</p>
                </div>
                
                {address && (
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    style={bookButtonStyle}
                  >
                    Book Appointment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Styles
const sectionStyle = {
  padding: '50px 20px',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '50px'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontSize: '18px'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '50px',
  color: '#6c757d'
};

const doctorsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '30px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const doctorCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
};

const doctorImageContainerStyle = {
  position: 'relative',
  height: '250px',
  overflow: 'hidden'
};

const doctorImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const statusBadgeStyle = {
  position: 'absolute',
  top: '15px',
  right: '15px',
  backgroundColor: '#28a745',
  color: 'white',
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center'
};

const doctorInfoStyle = {
  padding: '25px'
};

const specializationStyle = {
  color: '#007bff',
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '20px'
};

const doctorDetailsStyle = {
  marginBottom: '20px'
};

const detailItemStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '10px',
  fontSize: '14px',
  color: '#666'
};

const statsStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px'
};

const statItemStyle = {
  textAlign: 'center'
};

const statNumberStyle = {
  display: 'block',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#007bff'
};

const statLabelStyle = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase'
};

const biographyStyle = {
  marginBottom: '20px'
};

const bookButtonStyle = {
  width: '100%',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

export default Doctors;
