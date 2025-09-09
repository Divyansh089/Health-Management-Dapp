import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import '../styles/AdminDashboard.css';
import { 
  GET_ALL_REGISTERED_DOCTORS,
  GET_ALL_REGISTERED_PATIENTS,
  GET_ALL_REGISTERED_MEDICINES,
  GET_ALL_APPOINTMENTS,
  GET_FEE
} from '../../Context/constants';
import { 
  FaUserShield, 
  FaUserMd, 
  FaUserInjured, 
  FaPills, 
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaEdit,
  FaSpinner,
  FaComments,
  FaBell
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { 
    APPROVE_DOCTOR_STATUS,
    UPDATE_REGISTRATION_DOCTOR_FEE,
    UPDATE_REGISTRATION_PATIENT_FEE,
    UPDATE_APPOINTMENT_FEE,
    UPDATE_ADMIN_ADDRESS,
    loader 
  } = useStateContext();
  
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [fees, setFees] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load all data
      const [doctorsData, patientsData, medicinesData, appointmentsData, feesData] = await Promise.all([
        GET_ALL_REGISTERED_DOCTORS(),
        GET_ALL_REGISTERED_PATIENTS(),
        GET_ALL_REGISTERED_MEDICINES(),
        GET_ALL_APPOINTMENTS(),
        GET_FEE()
      ]);
      
      setDoctors(doctorsData);
      setPatients(patientsData);
      setMedicines(medicinesData);
      setAppointments(appointmentsData);
      setFees(feesData);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      await APPROVE_DOCTOR_STATUS(doctorId);
      loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Error approving doctor:', error);
    }
  };

  const handleUpdateFee = async (feeType, newFee) => {
    try {
      switch (feeType) {
        case 'doctor':
          await UPDATE_REGISTRATION_DOCTOR_FEE(newFee);
          break;
        case 'patient':
          await UPDATE_REGISTRATION_PATIENT_FEE(newFee);
          break;
        case 'appointment':
          await UPDATE_APPOINTMENT_FEE(newFee);
          break;
        default:
          break;
      }
      loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Error updating fee:', error);
    }
  };

  const handleUpdateAdminAddress = async (newAddress) => {
    try {
      await UPDATE_ADMIN_ADDRESS(newAddress);
      loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Error updating admin address:', error);
    }
  };

  if (loading) {
    return (
      <div className="admindashboard-loading">
        <FaSpinner className="fa-spin admindashboard-spinner" />
        <div className="admindashboard-loadingText">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admindashboard-section">
      <div className="admindashboard-container">
        <div className="admindashboard-header">
          <h1 className="admindashboard-title">
            <FaUserShield style={{ marginRight: '10px' }} />
            Admin Dashboard
          </h1>
          <p className="admindashboard-subtitle">Manage the ERES Health Management System</p>
        </div>

        <div className="admindashboard-tabs">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`admindashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('doctors')}
            className={`admindashboard-tab ${activeTab === 'doctors' ? 'active' : ''}`}
          >
            <FaUserMd style={{ marginRight: '8px' }} />
            Doctors
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={`admindashboard-tab ${activeTab === 'patients' ? 'active' : ''}`}
          >
            <FaUserInjured style={{ marginRight: '8px' }} />
            Patients
          </button>
          <button 
            onClick={() => setActiveTab('medicines')}
            className={`admindashboard-tab ${activeTab === 'medicines' ? 'active' : ''}`}
          >
            <FaPills style={{ marginRight: '8px' }} />
            Medicines
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`admindashboard-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          >
            <FaCalendarAlt style={{ marginRight: '8px' }} />
            Appointments
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`admindashboard-tab ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <FaEdit style={{ marginRight: '8px' }} />
            Settings
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`admindashboard-tab ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <FaComments style={{ marginRight: '8px' }} />
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`admindashboard-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          >
            <FaBell style={{ marginRight: '8px' }} />
            Notifications
          </button>
        </div>

        <div className="admindashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            doctors={doctors}
            patients={patients}
            medicines={medicines}
            appointments={appointments}
            fees={fees}
          />
        )}
        
        {activeTab === 'doctors' && (
          <DoctorsTab 
            doctors={doctors}
            onApproveDoctor={handleApproveDoctor}
          />
        )}
        
        {activeTab === 'patients' && (
          <PatientsTab patients={patients} />
        )}
        
        {activeTab === 'medicines' && (
          <MedicinesTab medicines={medicines} />
        )}
        
        {activeTab === 'appointments' && (
          <AppointmentsTab appointments={appointments} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab 
            fees={fees}
            onUpdateFee={handleUpdateFee}
            onUpdateAdminAddress={handleUpdateAdminAddress}
          />
        )}
        
        {activeTab === 'chat' && (
          <div>
            <h2>Chat System</h2>
            <p>Access the chat system to communicate with users and manage communications.</p>
            <button 
              onClick={() => window.location.href = '/chat'}
              className="admindashboard-updateBtn"
            >
              Open Chat System
            </button>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div>
            <h2>Notifications</h2>
            <p>View system notifications and manage user communications.</p>
            <button 
              onClick={() => window.location.href = '/notifications'}
              className="admindashboard-updateBtn"
            >
              View Notifications
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ doctors, patients, medicines, appointments, fees }) => {
  const pendingDoctors = doctors.filter(doctor => !doctor.isApproved);
  const approvedDoctors = doctors.filter(doctor => doctor.isApproved);
  const activeMedicines = medicines.filter(medicine => medicine.active);
  const openAppointments = appointments.filter(apt => apt.isOpen);

  return (
    <div style={tabContentStyle}>
      <h2>System Overview</h2>
      
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <h3>Total Doctors</h3>
          <p style={statNumberStyle}>{doctors.length}</p>
          <p style={statSubtextStyle}>
            {approvedDoctors.length} approved, {pendingDoctors.length} pending
          </p>
        </div>
        
        <div style={statCardStyle}>
          <h3>Total Patients</h3>
          <p style={statNumberStyle}>{patients.length}</p>
        </div>
        
        <div style={statCardStyle}>
          <h3>Total Medicines</h3>
          <p style={statNumberStyle}>{medicines.length}</p>
          <p style={statSubtextStyle}>
            {activeMedicines.length} active
          </p>
        </div>
        
        <div style={statCardStyle}>
          <h3>Total Appointments</h3>
          <p style={statNumberStyle}>{appointments.length}</p>
          <p style={statSubtextStyle}>
            {openAppointments.length} open
          </p>
        </div>
      </div>

      {fees && (
        <div style={feesSectionStyle}>
          <h3>Current Fees</h3>
          <div style={feesGridStyle}>
            <div style={feeItemStyle}>
              <strong>Doctor Registration:</strong> {fees.doctorFee} ETH
            </div>
            <div style={feeItemStyle}>
              <strong>Patient Registration:</strong> {fees.patientFee} ETH
            </div>
            <div style={feeItemStyle}>
              <strong>Appointment Fee:</strong> {fees.appointmentFee} ETH
            </div>
            <div style={feeItemStyle}>
              <strong>Admin Address:</strong> {fees.admin}
            </div>
          </div>
        </div>
      )}

      {pendingDoctors.length > 0 && (
        <div style={alertSectionStyle}>
          <h3>Pending Doctor Approvals</h3>
          <p>You have {pendingDoctors.length} doctors waiting for approval.</p>
        </div>
      )}
    </div>
  );
};

const DoctorsTab = ({ doctors, onApproveDoctor }) => {
  const pendingDoctors = doctors.filter(doctor => !doctor.isApproved);
  const approvedDoctors = doctors.filter(doctor => doctor.isApproved);

  return (
    <div style={tabContentStyle}>
      <h2>Doctor Management</h2>
      
      {pendingDoctors.length > 0 && (
        <div style={sectionStyle}>
          <h3>Pending Approvals ({pendingDoctors.length})</h3>
          <div style={doctorsGridStyle}>
            {pendingDoctors.map(doctor => (
              <div key={doctor.doctorID} style={doctorCardStyle}>
                <img src={doctor.image} alt="Doctor" style={doctorImageStyle} />
                <div style={doctorInfoStyle}>
                  <h4>{doctor.title} {doctor.firstName} {doctor.lastName}</h4>
                  <p><strong>Specialization:</strong> {doctor.specialization}</p>
                  <p><strong>Degree:</strong> {doctor.degrer}</p>
                  <p><strong>Registration ID:</strong> {doctor.registrationID}</p>
                  <p><strong>Email:</strong> {doctor.emailID}</p>
                  <p><strong>Mobile:</strong> {doctor.mobile}</p>
                  <p><strong>College:</strong> {doctor.collageName}</p>
                  
                  <div style={doctorActionsStyle}>
                    <button 
                      onClick={() => onApproveDoctor(doctor.doctorID)}
                      style={approveButtonStyle}
                    >
                      <FaCheck style={{ marginRight: '5px' }} />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <h3>Approved Doctors ({approvedDoctors.length})</h3>
        <div style={doctorsGridStyle}>
          {approvedDoctors.map(doctor => (
            <div key={doctor.doctorID} style={doctorCardStyle}>
              <img src={doctor.image} alt="Doctor" style={doctorImageStyle} />
              <div style={doctorInfoStyle}>
                <h4>{doctor.title} {doctor.firstName} {doctor.lastName}</h4>
                <p><strong>Specialization:</strong> {doctor.specialization}</p>
                <p><strong>Degree:</strong> {doctor.degrer}</p>
                <p><strong>Appointments:</strong> {doctor.appointmentCount}</p>
                <p><strong>Successful Treatments:</strong> {doctor.successfulTreatmentCount}</p>
                <p><strong>Email:</strong> {doctor.emailID}</p>
                <p><strong>Mobile:</strong> {doctor.mobile}</p>
                
                <div style={statusBadgeStyle(true)}>
                  <FaCheck style={{ marginRight: '5px' }} />
                  Approved
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PatientsTab = ({ patients }) => (
  <div style={tabContentStyle}>
    <h2>Patient Management</h2>
    <div style={patientsGridStyle}>
      {patients.map(patient => (
        <div key={patient.patientID} style={patientCardStyle}>
          <img src={patient.image} alt="Patient" style={patientImageStyle} />
          <div style={patientInfoStyle}>
            <h4>{patient.title} {patient.firstName} {patient.lastName}</h4>
            <p><strong>Patient ID:</strong> {patient.patientID}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Date of Birth:</strong> {patient.birth}</p>
            <p><strong>Email:</strong> {patient.emailID}</p>
            <p><strong>Mobile:</strong> {patient.mobile}</p>
            <p><strong>City:</strong> {patient.city}</p>
            <p><strong>Address:</strong> {patient.yourAddress}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MedicinesTab = ({ medicines }) => (
  <div style={tabContentStyle}>
    <h2>Medicine Management</h2>
    <div style={medicinesGridStyle}>
      {medicines.map(medicine => (
        <div key={medicine.medicineID} style={medicineCardStyle}>
          <img src={medicine.image} alt={medicine.name} style={medicineImageStyle} />
          <div style={medicineInfoStyle}>
            <h4>{medicine.name}</h4>
            <p><strong>Brand:</strong> {medicine.brand}</p>
            <p><strong>Manufacturer:</strong> {medicine.manufacturer}</p>
            <p><strong>Price:</strong> {medicine.price} ETH</p>
            <p><strong>Quantity:</strong> {medicine.quantity}</p>
            <p><strong>Discount:</strong> {medicine.discount}%</p>
            <p><strong>Location:</strong> {medicine.currentLocation}</p>
            <p><strong>Status:</strong> {medicine.active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AppointmentsTab = ({ appointments }) => (
  <div style={tabContentStyle}>
    <h2>Appointment Management</h2>
    <div style={appointmentsListStyle}>
      {appointments.map(appointment => (
        <div key={appointment.appointmentID} style={appointmentCardStyle}>
          <div style={appointmentHeaderStyle}>
            <h4>Appointment #{appointment.appointmentID}</h4>
            <span style={appointment.statusStyle(appointment.isOpen)}>
              {appointment.isOpen ? 'Open' : 'Completed'}
            </span>
          </div>
          <div style={appointmentDetailsStyle}>
            <p><strong>Patient ID:</strong> {appointment.patientId}</p>
            <p><strong>Doctor ID:</strong> {appointment.doctorId}</p>
            <p><strong>Date:</strong> {appointment.appointmentDate}</p>
            <p><strong>Time:</strong> {appointment.from} - {appointment.to}</p>
            <p><strong>Condition:</strong> {appointment.condition}</p>
            <p><strong>Message:</strong> {appointment.message}</p>
            <p><strong>Booked:</strong> {appointment.date}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsTab = ({ fees, onUpdateFee, onUpdateAdminAddress }) => {
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [feeType, setFeeType] = useState('');
  const [newFee, setNewFee] = useState('');
  const [newAdminAddress, setNewAdminAddress] = useState('');

  const handleUpdateFee = (e) => {
    e.preventDefault();
    onUpdateFee(feeType, newFee);
    setShowFeeModal(false);
    setFeeType('');
    setNewFee('');
  };

  const handleUpdateAdmin = (e) => {
    e.preventDefault();
    onUpdateAdminAddress(newAdminAddress);
    setShowAdminModal(false);
    setNewAdminAddress('');
  };

  return (
    <div style={tabContentStyle}>
      <h2>System Settings</h2>
      
      <div style={settingsGridStyle}>
        <div style={settingCardStyle}>
          <h3>Registration Fees</h3>
          <p>Manage registration fees for doctors and patients</p>
          <button 
            onClick={() => setShowFeeModal(true)}
            style={primaryButtonStyle}
          >
            <FaEdit style={{ marginRight: '8px' }} />
            Update Fees
          </button>
        </div>
        
        <div style={settingCardStyle}>
          <h3>Admin Address</h3>
          <p>Update the admin wallet address</p>
          <button 
            onClick={() => setShowAdminModal(true)}
            style={primaryButtonStyle}
          >
            <FaEdit style={{ marginRight: '8px' }} />
            Update Admin
          </button>
        </div>
      </div>

      {fees && (
        <div style={currentSettingsStyle}>
          <h3>Current Settings</h3>
          <div style={settingsListStyle}>
            <div><strong>Doctor Registration Fee:</strong> {fees.doctorFee} ETH</div>
            <div><strong>Patient Registration Fee:</strong> {fees.patientFee} ETH</div>
            <div><strong>Appointment Fee:</strong> {fees.appointmentFee} ETH</div>
            <div><strong>Admin Address:</strong> {fees.admin}</div>
          </div>
        </div>
      )}

      {/* Fee Update Modal */}
      {showFeeModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>Update Registration Fee</h3>
            <form onSubmit={handleUpdateFee}>
              <div style={formGroupStyle}>
                <label>Fee Type:</label>
                <select 
                  value={feeType} 
                  onChange={(e) => setFeeType(e.target.value)}
                  required
                  style={selectStyle}
                >
                  <option value="">Select fee type</option>
                  <option value="doctor">Doctor Registration</option>
                  <option value="patient">Patient Registration</option>
                  <option value="appointment">Appointment Fee</option>
                </select>
              </div>
              
              <div style={formGroupStyle}>
                <label>New Fee (ETH):</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              
              <div style={buttonGroupStyle}>
                <button type="submit" style={primaryButtonStyle}>Update Fee</button>
                <button 
                  type="button" 
                  onClick={() => setShowFeeModal(false)}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Address Update Modal */}
      {showAdminModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>Update Admin Address</h3>
            <form onSubmit={handleUpdateAdmin}>
              <div style={formGroupStyle}>
                <label>New Admin Address:</label>
                <input 
                  type="text" 
                  value={newAdminAddress}
                  onChange={(e) => setNewAdminAddress(e.target.value)}
                  placeholder="0x..."
                  required
                  style={inputStyle}
                />
              </div>
              
              <div style={buttonGroupStyle}>
                <button type="submit" style={primaryButtonStyle}>Update Admin</button>
                <button 
                  type="button" 
                  onClick={() => setShowAdminModal(false)}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles


const tabContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const statCardStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px solid #dee2e6'
};

const statNumberStyle = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#007bff',
  margin: '10px 0'
};

const statSubtextStyle = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '5px 0'
};

const feesSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6'
};

const feesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginTop: '15px'
};

const feeItemStyle = {
  padding: '10px',
  backgroundColor: 'white',
  borderRadius: '6px',
  border: '1px solid #dee2e6'
};

const alertSectionStyle = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '8px',
  padding: '20px',
  color: '#856404'
};

const sectionStyle = {
  marginBottom: '30px'
};

const doctorsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
  marginTop: '15px'
};

const doctorCardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  display: 'flex',
  flexDirection: 'column'
};

const doctorImageStyle = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
  marginBottom: '15px'
};

const doctorInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const doctorActionsStyle = {
  marginTop: '15px'
};

const approveButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'bold'
};

const statusBadgeStyle = (isApproved) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: isApproved ? '#d4edda' : '#f8d7da',
  color: isApproved ? '#155724' : '#721c24',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'bold',
  marginTop: '10px'
});

const patientsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px'
};

const patientCardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  display: 'flex',
  flexDirection: 'column'
};

const patientImageStyle = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
  marginBottom: '15px'
};

const patientInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const medicinesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px'
};

const medicineCardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  display: 'flex',
  flexDirection: 'column'
};

const medicineImageStyle = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
  marginBottom: '15px'
};

const medicineInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const appointmentsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const appointmentCardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#f8f9fa'
};

const appointmentHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};



const appointmentDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '10px'
};

const settingsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const settingCardStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'center'
};

const primaryButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'bold',
  margin: '10px auto 0'
};

const secondaryButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer'
};

const currentSettingsStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6'
};

const settingsListStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '10px',
  marginTop: '15px'
};

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  maxWidth: '500px',
  width: '90%',
  maxHeight: '80vh',
  overflowY: 'auto'
};

const formGroupStyle = {
  marginBottom: '15px'
};

const selectStyle = {
  width: '100%',
  padding: '8px',
  border: '1px solid #dee2e6',
  borderRadius: '4px'
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  border: '1px solid #dee2e6',
  borderRadius: '4px'
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '20px'
};



export default AdminDashboard;
