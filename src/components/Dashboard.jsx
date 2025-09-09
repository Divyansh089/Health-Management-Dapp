import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import { 
  CHECK_DOCTOR_REGISTERATION, 
  CHECK_PATIENT_REGISTERATION, 
  GET_USERNAME_TYPE,
  GET_FEE 
} from '../../Context/constants.jsx';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaUserInjured, FaCog, FaSpinner } from 'react-icons/fa';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { address, CONNECT_WALLET, loader } = useStateContext();
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fees, setFees] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRegistration();
  }, [address]);

  const checkUserRegistration = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if user is admin
      const feeData = await GET_FEE();
      setFees(feeData);
      
      if (address.toLowerCase() === feeData.admin.toLowerCase()) {
        setUserType('admin');
        setIsLoading(false);
        return;
      }

      // Check if user is a doctor
      try {
        const doctorData = await CHECK_DOCTOR_REGISTERATION(address);
        if (doctorData && doctorData.doctorID) {
          setUserType('doctor');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('Not a doctor:', error.message);
      }

      // Check if user is a patient
      try {
        const patientData = await CHECK_PATIENT_REGISTERATION(address);
        if (patientData && patientData.patientID) {
          setUserType('patient');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('Not a patient:', error.message);
      }

      // User is not registered
      setUserType('unregistered');
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user registration:', error);
      setUserType('unregistered');
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    await CONNECT_WALLET();
  };

  const renderUnregisteredUser = () => (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Welcome to ERES Health Management</h2>
        <p className="dashboard-message">
          Your wallet address is not registered in our system. Please choose how you'd like to register:
        </p>
        
        <div className="dashboard-buttonContainer">
          <button 
            onClick={() => navigate('/register?type=patient')}
            className="dashboard-button"
          >
            <FaUserInjured style={{ marginRight: '8px' }} />
            Register as Patient
          </button>
          
          <button 
            onClick={() => navigate('/register?type=doctor')}
            className="dashboard-button"
          >
            <FaUserMd style={{ marginRight: '8px' }} />
            Register as Doctor
          </button>
        </div>

        {fees && (
          <div className="dashboard-fees">
            <h3>Registration Fees:</h3>
            <p>Patient Registration: {fees.patientFee} ETH</p>
            <p>Doctor Registration: {fees.doctorFee} ETH</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <FaSpinner className="fa-spin" style={{ fontSize: '48px', color: '#007bff', marginBottom: '20px' }} />
        <h2>Checking your registration status...</h2>
        <p>Please wait while we verify your account.</p>
      </div>
    </div>
  );

  const renderRegisteredUser = () => {
    switch (userType) {
      case 'admin':
        navigate('/admin-dashboard');
        return null;
      case 'doctor':
        navigate('/doctor-dashboard');
        return null;
      case 'patient':
        navigate('/patient-dashboard');
        return null;
      default:
        return renderUnregisteredUser();
    }
  };

  if (!address) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2 className="dashboard-title">Connect Your Wallet</h2>
          <p className="dashboard-message">
            Please connect your wallet to access the ERES Health Management System.
          </p>
          <button 
            onClick={handleConnectWallet}
            className="dashboard-connectButton"
            disabled={loader}
          >
            {loader ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return renderLoading();
  }

  return renderRegisteredUser();
};

// Styles moved to Dashboard.css

export default Dashboard;

