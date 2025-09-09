import React, { useState, useEffect, useCallback } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import '../styles/DoctorDashboard.css';
import { 
  GET_DOCTOR_DETAILS, 
  GET_DOCTOR_APPOINTMENTS_HISTORYS,
  GET_ALL_REGISTERED_MEDICINES,
  GET_ALL_REGISTERED_PATIENTS
} from '../../Context/constants';
import { 
  FaUserMd, 
  FaCalendarAlt, 
  FaPills, 
  FaUsers, 
  FaPlus, 
  FaCheck, 
  FaEdit,
  FaSpinner,
  FaComments,
  FaBell
} from 'react-icons/fa';

const DoctorDashboard = () => {
  const { 
    address, 
    ADD_MEDICINE, 
    UPDATE_MEDICINE_LOCATION, 
    UPDATE_MEDICINE_PRICE, 
    UPDATE_MEDICINE_QUANTITY, 
    UPDATE_MEDICINE_DISCOUNT, 
    UPDATE_MEDICINE_ACTIVE,
    PRESCRIBE_MEDICINE,
    UPDATE_PATIENT_MEDICAL_HISTORY,
    COMPLETE_APPOINTMENT
  } = useStateContext();
  
  const [doctorData, setDoctorData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadDoctorData();
    }
  }, [address, loadDoctorData]);

  const loadDoctorData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get doctor details
      const doctor = await GET_DOCTOR_DETAILS(address);
      setDoctorData(doctor);
      
      // Get appointments
      const appointmentHistory = await GET_DOCTOR_APPOINTMENTS_HISTORYS(doctor.doctorID);
      setAppointments(appointmentHistory);
      
      // Get medicines
      const availableMedicines = await GET_ALL_REGISTERED_MEDICINES();
      setMedicines(availableMedicines);
      
      // Get patients
      const patientsList = await GET_ALL_REGISTERED_PATIENTS();
      setPatients(patientsList);
      
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const handleAddMedicine = async (medicineData) => {
    try {
      await ADD_MEDICINE(medicineData);
      loadDoctorData(); // Refresh data
    } catch (error) {
      console.error('Error adding medicine:', error);
    }
  };

  const handleUpdateMedicine = async (medicineId, updateType, value) => {
    try {
      const updateData = { medicineID: medicineId, update: value };
      
      switch (updateType) {
        case 'location':
          await UPDATE_MEDICINE_LOCATION(updateData);
          break;
        case 'price':
          await UPDATE_MEDICINE_PRICE(updateData);
          break;
        case 'quantity':
          await UPDATE_MEDICINE_QUANTITY(updateData);
          break;
        case 'discount':
          await UPDATE_MEDICINE_DISCOUNT(updateData);
          break;
        case 'active':
          await UPDATE_MEDICINE_ACTIVE(medicineId);
          break;
        default:
          break;
      }
      loadDoctorData(); // Refresh data
    } catch (error) {
      console.error('Error updating medicine:', error);
    }
  };

  const handlePrescribeMedicine = async (medicineId, patientId) => {
    try {
      await PRESCRIBE_MEDICINE({ medicineID: medicineId, patientID: patientId });
      loadDoctorData(); // Refresh data
    } catch (error) {
      console.error('Error prescribing medicine:', error);
    }
  };

  const handleUpdateMedicalHistory = async (patientId, message) => {
    try {
      await UPDATE_PATIENT_MEDICAL_HISTORY({ patientID: patientId, message });
      loadDoctorData(); // Refresh data
    } catch (error) {
      console.error('Error updating medical history:', error);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await COMPLETE_APPOINTMENT(appointmentId);
      loadDoctorData(); // Refresh data
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <FaSpinner className="fa-spin" style={{ fontSize: '48px', marginBottom: '20px' }} />
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  if (!doctorData) {
    return (
      <div style={errorStyle}>
        <div>Error loading doctor data. Please try again.</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>Doctor Dashboard</h1>
        <div style={doctorInfoStyle}>
          <img src={doctorData.image} alt="Profile" style={profileImageStyle} />
          <div>
            <h2>{doctorData.title} {doctorData.firstName} {doctorData.lastName}</h2>
            <p>Doctor ID: {doctorData.doctorID}</p>
            <p>Specialization: {doctorData.specialization}</p>
            <p>Appointments: {doctorData.appointmentCount}</p>
            <p>Successful Treatments: {doctorData.successfulTreatmentCount}</p>
          </div>
        </div>
      </div>

      <div style={tabsStyle}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? activeTabStyle : tabStyle}
        >
          <FaUserMd style={{ marginRight: '8px' }} />
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          style={activeTab === 'appointments' ? activeTabStyle : tabStyle}
        >
          <FaCalendarAlt style={{ marginRight: '8px' }} />
          Appointments
        </button>
        <button 
          onClick={() => setActiveTab('medicines')}
          style={activeTab === 'medicines' ? activeTabStyle : tabStyle}
        >
          <FaPills style={{ marginRight: '8px' }} />
          Medicines
        </button>
        <button 
          onClick={() => setActiveTab('patients')}
          style={activeTab === 'patients' ? activeTabStyle : tabStyle}
        >
          <FaUsers style={{ marginRight: '8px' }} />
          Patients
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          style={activeTab === 'chat' ? activeTabStyle : tabStyle}
        >
          <FaComments style={{ marginRight: '8px' }} />
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          style={activeTab === 'notifications' ? activeTabStyle : tabStyle}
        >
          <FaBell style={{ marginRight: '8px' }} />
          Notifications
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'overview' && (
          <OverviewTab 
            doctorData={doctorData}
            appointments={appointments}
            medicines={medicines}
            patients={patients}
          />
        )}
        
        {activeTab === 'appointments' && (
          <AppointmentsTab 
            appointments={appointments}
            onCompleteAppointment={handleCompleteAppointment}
            onPrescribeMedicine={handlePrescribeMedicine}
            medicines={medicines}
          />
        )}
        
        {activeTab === 'medicines' && (
          <MedicinesTab 
            medicines={medicines}
            onAddMedicine={handleAddMedicine}
            onUpdateMedicine={handleUpdateMedicine}
          />
        )}
        
        {activeTab === 'patients' && (
          <PatientsTab 
            patients={patients}
            onUpdateMedicalHistory={handleUpdateMedicalHistory}
          />
        )}
        
        {activeTab === 'chat' && (
          <div style={tabContentStyle}>
            <h2>Chat System</h2>
            <p>Access the chat system to communicate with patients and other users.</p>
            <button 
              onClick={() => window.location.href = '/chat'}
              style={primaryButtonStyle}
            >
              Open Chat System
            </button>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div style={tabContentStyle}>
            <h2>Notifications</h2>
            <p>View your notifications and stay updated with important information.</p>
            <button 
              onClick={() => window.location.href = '/notifications'}
              style={primaryButtonStyle}
            >
              View Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ doctorData, appointments, medicines, patients }) => (
  <div style={tabContentStyle}>
    <h2>Overview</h2>
    
    <div style={statsGridStyle}>
      <div style={statCardStyle}>
        <h3>Total Appointments</h3>
        <p style={statNumberStyle}>{appointments.length}</p>
      </div>
      <div style={statCardStyle}>
        <h3>Active Medicines</h3>
        <p style={statNumberStyle}>{medicines.filter(m => m.active).length}</p>
      </div>
      <div style={statCardStyle}>
        <h3>Total Patients</h3>
        <p style={statNumberStyle}>{patients.length}</p>
      </div>
      <div style={statCardStyle}>
        <h3>Success Rate</h3>
        <p style={statNumberStyle}>
          {appointments.length > 0 ? 
            Math.round((doctorData.successfulTreatmentCount / appointments.length) * 100) : 0}%
        </p>
      </div>
    </div>

    <div style={infoSectionStyle}>
      <h3>Professional Information</h3>
      <div style={infoGridStyle}>
        <div><strong>Name:</strong> {doctorData.title} {doctorData.firstName} {doctorData.lastName}</div>
        <div><strong>Specialization:</strong> {doctorData.specialization}</div>
        <div><strong>Degree:</strong> {doctorData.degrer}</div>
        <div><strong>Registration ID:</strong> {doctorData.registrationID}</div>
        <div><strong>Designation:</strong> {doctorData.designation}</div>
        <div><strong>Last Work Place:</strong> {doctorData.lastWork}</div>
        <div><strong>College:</strong> {doctorData.collageName}</div>
        <div><strong>Email:</strong> {doctorData.emailID}</div>
        <div><strong>Mobile:</strong> {doctorData.mobile}</div>
      </div>
    </div>

    <div style={infoSectionStyle}>
      <h3>Biography</h3>
      <p>{doctorData.biography}</p>
    </div>
  </div>
);

const AppointmentsTab = ({ appointments, onCompleteAppointment, onPrescribeMedicine, medicines }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const openAppointments = appointments.filter(apt => apt.isOpen);
  const completedAppointments = appointments.filter(apt => !apt.isOpen);

  return (
    <div style={tabContentStyle}>
      <h2>Appointments</h2>
      
      <div style={appointmentTabsStyle}>
        <div style={appointmentSectionStyle}>
          <h3>Open Appointments ({openAppointments.length})</h3>
          <div style={appointmentsListStyle}>
            {openAppointments.map(appointment => (
              <div key={appointment.appoinmnetID} style={appointmentCardStyle}>
                <div style={appointmentHeaderStyle}>
                  <h4>Appointment #{appointment.appoinmnetID}</h4>
                  <span style={statusBadgeStyle(true)}>Open</span>
                </div>
                <div style={appointmentDetailsStyle}>
                  <p><strong>Patient:</strong> {appointment.patient?.title} {appointment.patient?.firstName} {appointment.patient?.lastName}</p>
                  <p><strong>Date:</strong> {appointment.appointmentDate}</p>
                  <p><strong>Time:</strong> {appointment.from} - {appointment.to}</p>
                  <p><strong>Condition:</strong> {appointment.condition}</p>
                  <p><strong>Message:</strong> {appointment.message}</p>
                </div>
                <div style={appointmentActionsStyle}>
                  <button 
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowPrescriptionModal(true);
                    }}
                    style={actionButtonStyle}
                  >
                    <FaPills style={{ marginRight: '5px' }} />
                    Prescribe
                  </button>
                  <button 
                    onClick={() => onCompleteAppointment(appointment.appoinmnetID)}
                    style={completeButtonStyle}
                  >
                    <FaCheck style={{ marginRight: '5px' }} />
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={appointmentSectionStyle}>
          <h3>Completed Appointments ({completedAppointments.length})</h3>
          <div style={appointmentsListStyle}>
            {completedAppointments.map(appointment => (
              <div key={appointment.appoinmnetID} style={appointmentCardStyle}>
                <div style={appointmentHeaderStyle}>
                  <h4>Appointment #{appointment.appoinmnetID}</h4>
                  <span style={statusBadgeStyle(false)}>Completed</span>
                </div>
                <div style={appointmentDetailsStyle}>
                  <p><strong>Patient:</strong> {appointment.patient?.title} {appointment.patient?.firstName} {appointment.patient?.lastName}</p>
                  <p><strong>Date:</strong> {appointment.appointmentDate}</p>
                  <p><strong>Time:</strong> {appointment.from} - {appointment.to}</p>
                  <p><strong>Condition:</strong> {appointment.condition}</p>
                  <p><strong>Completed:</strong> {appointment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <PrescriptionModal
          appointment={selectedAppointment}
          medicines={medicines}
          onPrescribe={onPrescribeMedicine}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
};

const PrescriptionModal = ({ appointment, medicines, onPrescribe, onClose }) => {
  const [selectedMedicine, setSelectedMedicine] = useState('');

  const handlePrescribe = () => {
    if (selectedMedicine) {
      onPrescribe(selectedMedicine, appointment.patientId);
      onClose();
    }
  };

  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <h3>Prescribe Medicine</h3>
        <div style={modalBodyStyle}>
          <p><strong>Patient:</strong> {appointment.patient?.title} {appointment.patient?.firstName} {appointment.patient?.lastName}</p>
          <p><strong>Condition:</strong> {appointment.condition}</p>
          
          <div style={formGroupStyle}>
            <label>Select Medicine:</label>
            <select 
              value={selectedMedicine} 
              onChange={(e) => setSelectedMedicine(e.target.value)}
              style={selectStyle}
            >
              <option value="">Choose a medicine</option>
              {medicines.filter(medicine => medicine.active).map(medicine => (
                <option key={medicine.medicineID} value={medicine.medicineID}>
                  {medicine.name} - {medicine.brand} ({medicine.price} ETH)
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={modalActionsStyle}>
          <button onClick={handlePrescribe} style={primaryButtonStyle} disabled={!selectedMedicine}>
            Prescribe Medicine
          </button>
          <button onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const MedicinesTab = ({ medicines, onAddMedicine, onUpdateMedicine }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const medicineData = {
      verifyingDoctor: formData.get('verifyingDoctor'),
      name: formData.get('name'),
      brand: formData.get('brand'),
      manufacturer: formData.get('manufacturer'),
      manufacturDate: formData.get('manufacturDate'),
      expiryDate: formData.get('expiryDate'),
      code: formData.get('code'),
      companyEmail: formData.get('companyEmail'),
      discount: formData.get('discount'),
      manufactureAddress: formData.get('manufactureAddress'),
      price: formData.get('price'),
      quentity: formData.get('quentity'),
      currentLocation: formData.get('currentLocation'),
      mobile: formData.get('mobile'),
      email: formData.get('email'),
      image: formData.get('image'),
      description: formData.get('description')
    };
    
    await onAddMedicine(medicineData);
    setShowAddForm(false);
    e.target.reset();
  };

  const handleUpdate = (medicineId, field, value) => {
    onUpdateMedicine(medicineId, field, value);
    setEditingMedicine(null);
  };

  return (
    <div style={tabContentStyle}>
      <div style={sectionHeaderStyle}>
        <h2>Medicine Management</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          style={primaryButtonStyle}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          Add Medicine
        </button>
      </div>

      {showAddForm && (
        <AddMedicineForm 
          onSubmit={handleAddMedicine}
          onCancel={() => setShowAddForm(false)}
        />
      )}

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
              
              <div style={medicineActionsStyle}>
                <button 
                  onClick={() => setEditingMedicine(medicine.medicineID)}
                  style={editButtonStyle}
                >
                  <FaEdit style={{ marginRight: '5px' }} />
                  Edit
                </button>
                <button 
                  onClick={() => onUpdateMedicine(medicine.medicineID, 'active')}
                  style={medicine.active ? deactivateButtonStyle : activateButtonStyle}
                >
                  {medicine.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              {editingMedicine === medicine.medicineID && (
                <EditMedicineForm 
                  medicine={medicine}
                  onSave={handleUpdate}
                  onCancel={() => setEditingMedicine(null)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddMedicineForm = ({ onSubmit, onCancel }) => (
  <div style={formModalStyle}>
    <form onSubmit={onSubmit} style={formStyle}>
      <h3>Add New Medicine</h3>
      
      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label>Medicine Name *</label>
          <input type="text" name="name" required />
        </div>
        <div style={formGroupStyle}>
          <label>Brand *</label>
          <input type="text" name="brand" required />
        </div>
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label>Manufacturer *</label>
          <input type="text" name="manufacturer" required />
        </div>
        <div style={formGroupStyle}>
          <label>Price (ETH) *</label>
          <input type="number" step="0.001" name="price" required />
        </div>
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label>Quantity *</label>
          <input type="number" name="quentity" required />
        </div>
        <div style={formGroupStyle}>
          <label>Discount (%) *</label>
          <input type="number" name="discount" required />
        </div>
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label>Manufacture Date *</label>
          <input type="date" name="manufacturDate" required />
        </div>
        <div style={formGroupStyle}>
          <label>Expiry Date *</label>
          <input type="date" name="expiryDate" required />
        </div>
      </div>

      <div style={formGroupStyle}>
        <label>Current Location *</label>
        <input type="text" name="currentLocation" required />
      </div>

      <div style={formGroupStyle}>
        <label>Description *</label>
        <textarea name="description" rows="3" required />
      </div>

      <div style={buttonGroupStyle}>
        <button type="submit" style={primaryButtonStyle}>Add Medicine</button>
        <button type="button" onClick={onCancel} style={secondaryButtonStyle}>Cancel</button>
      </div>
    </form>
  </div>
);

const EditMedicineForm = ({ medicine, onSave, onCancel }) => {
  const [values, setValues] = useState({
    price: medicine.price,
    quantity: medicine.quantity,
    discount: medicine.discount,
    location: medicine.currentLocation
  });

  const handleSave = (field) => {
    onSave(medicine.medicineID, field, values[field]);
  };

  return (
    <div style={editFormStyle}>
      <h4>Edit Medicine Details</h4>
      
      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label>Price (ETH)</label>
          <input 
            type="number" 
            step="0.001"
            value={values.price}
            onChange={(e) => setValues({...values, price: e.target.value})}
          />
          <button onClick={() => handleSave('price')} style={updateButtonStyle}>
            Update Price
          </button>
        </div>
        
        <div style={formGroupStyle}>
          <label>Quantity</label>
          <input 
            type="number"
            value={values.quantity}
            onChange={(e) => setValues({...values, quantity: e.target.value})}
          />
          <button onClick={() => handleSave('quantity')} style={updateButtonStyle}>
            Update Quantity
          </button>
        </div>
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label>Discount (%)</label>
          <input 
            type="number"
            value={values.discount}
            onChange={(e) => setValues({...values, discount: e.target.value})}
          />
          <button onClick={() => handleSave('discount')} style={updateButtonStyle}>
            Update Discount
          </button>
        </div>
        
        <div style={formGroupStyle}>
          <label>Location</label>
          <input 
            type="text"
            value={values.location}
            onChange={(e) => setValues({...values, location: e.target.value})}
          />
          <button onClick={() => handleSave('location')} style={updateButtonStyle}>
            Update Location
          </button>
        </div>
      </div>

      <button onClick={onCancel} style={secondaryButtonStyle}>
        Close
      </button>
    </div>
  );
};

const PatientsTab = ({ patients }) => {


  return (
    <div style={tabContentStyle}>
      <h2>Patients</h2>
      
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
              
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

// Styles
const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  padding: '20px'
};

const headerStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '30px',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const doctorInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  marginTop: '20px'
};

const profileImageStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  objectFit: 'cover'
};

const tabsStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  flexWrap: 'wrap'
};

const tabStyle = {
  padding: '12px 24px',
  backgroundColor: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
};

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: '#007bff',
  color: 'white'
};

const contentStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '30px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const tabContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#007bff',
  margin: '10px 0'
};

const infoSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6'
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '10px',
  marginTop: '15px'
};

const appointmentTabsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
};

const appointmentSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6'
};

const appointmentsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginTop: '15px'
};

const appointmentCardStyle = {
  backgroundColor: 'white',
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px'
};

const appointmentHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const statusBadgeStyle = (isOpen) => ({
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: isOpen ? '#28a745' : '#6c757d',
  color: 'white'
});

const appointmentDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '10px',
  marginBottom: '15px'
};

const appointmentActionsStyle = {
  display: 'flex',
  gap: '10px'
};

const actionButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px'
};

const completeButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px'
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

const modalBodyStyle = {
  marginBottom: '20px'
};

const modalActionsStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end'
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
  fontWeight: 'bold'
};

const secondaryButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer'
};

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};

const formModalStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  marginBottom: '20px'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const formRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px'
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const selectStyle = {
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

const medicineActionsStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '15px'
};

const editButtonStyle = {
  backgroundColor: '#ffc107',
  color: 'black',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px'
};

const activateButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

const deactivateButtonStyle = {
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

const editFormStyle = {
  backgroundColor: 'white',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #dee2e6',
  marginTop: '15px'
};

const updateButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  marginTop: '5px'
};

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


const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontSize: '18px'
};

const errorStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontSize: '18px',
  color: '#dc3545'
};

export default DoctorDashboard;
