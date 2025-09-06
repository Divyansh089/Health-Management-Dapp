import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserInjured, FaArrowLeft } from 'react-icons/fa';

function PatientForm() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleRegisterAsPatient = () => {
    navigate('/register?type=patient');
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button onClick={handleGoBack} style={backButtonStyle}>
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Back to Home
          </button>
          <h2>
            <FaUserInjured style={{ marginRight: '10px' }} />
            Patient Portal
          </h2>
          <p style={subtitleStyle}>
            Access your patient dashboard or register as a new patient
          </p>
        </div>

        <div style={contentGridStyle}>
          <div style={infoCardStyle}>
            <h3>For New Patients</h3>
            <p>
              If you're new to ERES, you'll need to register as a patient first. 
              This will create your secure medical profile on the blockchain.
            </p>
            <ul style={featureListStyle}>
              <li>Secure medical record storage</li>
              <li>Easy appointment booking</li>
              <li>Access to verified doctors</li>
              <li>Medicine purchase tracking</li>
              <li>Prescription management</li>
            </ul>
            <button onClick={handleRegisterAsPatient} style={registerButtonStyle}>
              Register as Patient
            </button>
          </div>

          <div style={infoCardStyle}>
            <h3>For Existing Patients</h3>
            <p>
              If you're already registered, connect your wallet to access your 
              patient dashboard and manage your healthcare.
            </p>
            <ul style={featureListStyle}>
              <li>View medical history</li>
              <li>Book new appointments</li>
              <li>Check prescriptions</li>
              <li>Track medicine orders</li>
              <li>Update personal information</li>
            </ul>
            <button onClick={() => navigate('/dashboard')} style={dashboardButtonStyle}>
              Go to Dashboard
            </button>
          </div>
        </div>

        <div style={helpSectionStyle}>
          <h3>Need Help?</h3>
          <div style={helpGridStyle}>
            <div style={helpItemStyle}>
              <h4>Registration Process</h4>
              <p>
                You'll need to provide personal information, medical history, 
                and select a doctor. A small registration fee is required.
              </p>
            </div>
            <div style={helpItemStyle}>
              <h4>Wallet Connection</h4>
              <p>
                Connect your MetaMask wallet to access the platform. 
                Make sure you have some ETH for transaction fees.
              </p>
            </div>
            <div style={helpItemStyle}>
              <h4>Data Security</h4>
              <p>
                Your medical data is stored securely on the blockchain 
                and IPFS, ensuring privacy and immutability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Styles
const sectionStyle = {
  padding: '50px 20px',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh'
};

const containerStyle = {
  maxWidth: '1000px',
  margin: '0 auto'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '40px'
};

const backButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  marginBottom: '20px',
  fontSize: '14px'
};

const subtitleStyle = {
  fontSize: '16px',
  color: '#666',
  marginTop: '10px'
};

const contentGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '30px',
  marginBottom: '40px'
};

const infoCardStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  textAlign: 'center'
};

const featureListStyle = {
  listStyleType: 'disc',
  textAlign: 'left',
  margin: '20px 0',
  paddingLeft: '20px'
};

const registerButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '12px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '20px',
  transition: 'background-color 0.3s ease'
};

const dashboardButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '12px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '20px',
  transition: 'background-color 0.3s ease'
};

const helpSectionStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  textAlign: 'center'
};

const helpGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginTop: '20px'
};

const helpItemStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'left'
};

export default PatientForm;
