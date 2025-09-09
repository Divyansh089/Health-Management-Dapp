
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserInjured, FaArrowLeft } from 'react-icons/fa';
import '../styles/PatientForm.css';

function PatientForm() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleRegisterAsPatient = () => {
    navigate('/register?type=patient');
  };

  return (
    <section className="patientform-section">
      <div className="patientform-container">
        <div className="patientform-header">
          <button onClick={handleGoBack} className="patientform-backButton">
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Back to Home
          </button>
          <h2>
            <FaUserInjured style={{ marginRight: '10px' }} />
            Patient Portal
          </h2>
          <p className="patientform-subtitle">
            Access your patient dashboard or register as a new patient
          </p>
        </div>

        <div className="patientform-contentGrid">
          <div className="patientform-infoCard">
            <h3>For New Patients</h3>
            <p>
              If you're new to ERES, you'll need to register as a patient first. 
              This will create your secure medical profile on the blockchain.
            </p>
            <ul className="patientform-featureList">
              <li>Secure medical record storage</li>
              <li>Easy appointment booking</li>
              <li>Access to verified doctors</li>
              <li>Medicine purchase tracking</li>
              <li>Prescription management</li>
            </ul>
            <button onClick={handleRegisterAsPatient} className="patientform-registerButton">
              Register as Patient
            </button>
          </div>

          <div className="patientform-infoCard">
            <h3>For Existing Patients</h3>
            <p>
              If you're already registered, connect your wallet to access your 
              patient dashboard and manage your healthcare.
            </p>
            <ul className="patientform-featureList">
              <li>View medical history</li>
              <li>Book new appointments</li>
              <li>Check prescriptions</li>
              <li>Track medicine orders</li>
              <li>Update personal information</li>
            </ul>
            <button onClick={() => navigate('/dashboard')} className="patientform-dashboardButton">
              Go to Dashboard
            </button>
          </div>
        </div>

        <div className="patientform-helpSection">
          <h3>Need Help?</h3>
          <div className="patientform-helpGrid">
            <div className="patientform-helpItem">
              <h4>Registration Process</h4>
              <p>
                You'll need to provide personal information, medical history, 
                and select a doctor. A small registration fee is required.
              </p>
            </div>
            <div className="patientform-helpItem">
              <h4>Wallet Connection</h4>
              <p>
                Connect your MetaMask wallet to access the platform. 
                Make sure you have some ETH for transaction fees.
              </p>
            </div>
            <div className="patientform-helpItem">
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


export default PatientForm;
