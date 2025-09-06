import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index';
import { 
  CHECK_DOCTOR_REGISTERATION, 
  CHECK_PATIENT_REGISTERATION, 
  GET_USERNAME_TYPE,
  GET_FEE 
} from '../../Context/constants';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaUserInjured, FaCog, FaSpinner } from 'react-icons/fa';

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
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Welcome to ERES Health Management</h2>
        <p style={messageStyle}>
          Your wallet address is not registered in our system. Please choose how you'd like to register:
        </p>
        
        <div style={buttonContainerStyle}>
          <button 
            onClick={() => navigate('/register?type=patient')}
            style={buttonStyle}
          >
            <FaUserInjured style={{ marginRight: '8px' }} />
            Register as Patient
          </button>
          
          <button 
            onClick={() => navigate('/register?type=doctor')}
            style={buttonStyle}
          >
            <FaUserMd style={{ marginRight: '8px' }} />
            Register as Doctor
          </button>
        </div>

        {fees && (
          <div style={feesStyle}>
            <h3>Registration Fees:</h3>
            <p>Patient Registration: {fees.patientFee} ETH</p>
            <p>Doctor Registration: {fees.doctorFee} ETH</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLoading = () => (
    <div style={containerStyle}>
      <div style={cardStyle}>
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
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Connect Your Wallet</h2>
          <p style={messageStyle}>
            Please connect your wallet to access the ERES Health Management System.
          </p>
          <button 
            onClick={handleConnectWallet}
            style={connectButtonStyle}
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

// Styles
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '80vh',
  padding: '20px',
  backgroundColor: '#f8f9fa'
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '40px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  maxWidth: '600px',
  width: '100%'
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#333'
};

const messageStyle = {
  fontSize: '16px',
  color: '#666',
  marginBottom: '30px',
  lineHeight: '1.6'
};

const buttonContainerStyle = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap',
  marginBottom: '30px'
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '15px 30px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  minWidth: '200px',
  justifyContent: 'center'
};

const connectButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#28a745',
  padding: '15px 40px',
  fontSize: '18px'
};

const feesStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'left'
};

export default Dashboard;

