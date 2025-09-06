import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index';
import { 
  GET_PATIENT_DETAILS, 
  GET_PATIENT_APPOINTMENT_HISTORYS, 
  GET_ALL_PRESCRIBED_MEDICINES_OF_PATIENT,
  GET_ALL_PATIENT_ORDERS,
  GET_ALL_REGISTERED_MEDICINES
} from '../../Context/constants';
import { FaCalendarAlt, FaPills, FaShoppingCart, FaUser, FaHistory, FaPlus, FaComments, FaBell } from 'react-icons/fa';

const PatientDashboard = () => {
  const { address, BUY_MEDICINE, BOOK_APPOINTMENT, GET_ALL_APPROVE_DOCTORS } = useStateContext();
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadPatientData();
    }
  }, [address]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Get patient details
      const patient = await GET_PATIENT_DETAILS(address);
      setPatientData(patient);
      
      // Get appointments
      const appointmentHistory = await GET_PATIENT_APPOINTMENT_HISTORYS(patient.patientID);
      setAppointments(appointmentHistory);
      
      // Get prescriptions
      const prescribedMedicines = await GET_ALL_PRESCRIBED_MEDICINES_OF_PATIENT();
      setPrescriptions(prescribedMedicines);
      
      // Get orders
      const patientOrders = await GET_ALL_PATIENT_ORDERS(patient.patientID);
      setOrders(patientOrders);
      
      // Get available medicines
      const availableMedicines = await GET_ALL_REGISTERED_MEDICINES();
      setMedicines(availableMedicines);
      
      // Get doctors for booking appointments
      const doctorsList = await GET_ALL_APPROVE_DOCTORS();
      setDoctors(doctorsList);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyMedicine = async (medicineId, price, quantity) => {
    try {
      await BUY_MEDICINE(medicineId, price, quantity);
      loadPatientData(); // Refresh data
    } catch (error) {
      console.error('Error buying medicine:', error);
    }
  };

  const handleBookAppointment = async (doctorId, appointmentData) => {
    try {
      const doctor = doctors.find(d => d.doctorID === doctorId);
      await BOOK_APPOINTMENT(appointmentData, doctor);
      loadPatientData(); // Refresh data
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div style={errorStyle}>
        <div>Error loading patient data. Please try again.</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>Patient Dashboard</h1>
        <div style={patientInfoStyle}>
          <img src={patientData.image} alt="Profile" style={profileImageStyle} />
          <div>
            <h2>{patientData.title} {patientData.firstName} {patientData.lastName}</h2>
            <p>Patient ID: {patientData.patientID}</p>
            <p>City: {patientData.city}</p>
          </div>
        </div>
      </div>

      <div style={tabsStyle}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? activeTabStyle : tabStyle}
        >
          <FaUser style={{ marginRight: '8px' }} />
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
          onClick={() => setActiveTab('prescriptions')}
          style={activeTab === 'prescriptions' ? activeTabStyle : tabStyle}
        >
          <FaPills style={{ marginRight: '8px' }} />
          Prescriptions
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          style={activeTab === 'orders' ? activeTabStyle : tabStyle}
        >
          <FaHistory style={{ marginRight: '8px' }} />
          Orders
        </button>
        <button 
          onClick={() => setActiveTab('marketplace')}
          style={activeTab === 'marketplace' ? activeTabStyle : tabStyle}
        >
          <FaShoppingCart style={{ marginRight: '8px' }} />
          Marketplace
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
            patientData={patientData}
            appointments={appointments}
            prescriptions={prescriptions}
            orders={orders}
          />
        )}
        
        {activeTab === 'appointments' && (
          <AppointmentsTab 
            appointments={appointments}
            doctors={doctors}
            onBookAppointment={handleBookAppointment}
          />
        )}
        
        {activeTab === 'prescriptions' && (
          <PrescriptionsTab prescriptions={prescriptions} />
        )}
        
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} />
        )}
        
        {activeTab === 'marketplace' && (
          <MarketplaceTab 
            medicines={medicines}
            onBuyMedicine={handleBuyMedicine}
          />
        )}
        
        {activeTab === 'chat' && (
          <div style={tabContentStyle}>
            <h2>Chat System</h2>
            <p>Access the chat system to communicate with doctors and other users.</p>
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
const OverviewTab = ({ patientData, appointments, prescriptions, orders }) => (
  <div style={tabContentStyle}>
    <h2>Overview</h2>
    
    <div style={statsGridStyle}>
      <div style={statCardStyle}>
        <h3>Total Appointments</h3>
        <p style={statNumberStyle}>{appointments.length}</p>
      </div>
      <div style={statCardStyle}>
        <h3>Prescriptions</h3>
        <p style={statNumberStyle}>{prescriptions.length}</p>
      </div>
      <div style={statCardStyle}>
        <h3>Orders</h3>
        <p style={statNumberStyle}>{orders.length}</p>
      </div>
    </div>

    <div style={infoSectionStyle}>
      <h3>Personal Information</h3>
      <div style={infoGridStyle}>
        <div><strong>Name:</strong> {patientData.title} {patientData.firstName} {patientData.lastName}</div>
        <div><strong>Gender:</strong> {patientData.gender}</div>
        <div><strong>Date of Birth:</strong> {patientData.birth}</div>
        <div><strong>Email:</strong> {patientData.emailID}</div>
        <div><strong>Mobile:</strong> {patientData.mobile}</div>
        <div><strong>City:</strong> {patientData.city}</div>
        <div><strong>Address:</strong> {patientData.yourAddress}</div>
      </div>
    </div>

    <div style={infoSectionStyle}>
      <h3>Medical History</h3>
      <p>{patientData.medicialHistory}</p>
    </div>
  </div>
);

const AppointmentsTab = ({ appointments, doctors, onBookAppointment }) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    from: '',
    to: '',
    appointmentDate: '',
    condition: '',
    message: ''
  });

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    const doctorId = parseInt(e.target.doctorId.value);
    onBookAppointment(doctorId, bookingData);
    setShowBookingForm(false);
    setBookingData({
      from: '',
      to: '',
      appointmentDate: '',
      condition: '',
      message: ''
    });
  };

  return (
    <div style={tabContentStyle}>
      <div style={sectionHeaderStyle}>
        <h2>Appointments</h2>
        <button 
          onClick={() => setShowBookingForm(true)}
          style={primaryButtonStyle}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          Book Appointment
        </button>
      </div>

      {showBookingForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>Book New Appointment</h3>
            <form onSubmit={handleSubmitBooking}>
              <div style={formGroupStyle}>
                <label>Select Doctor:</label>
                <select name="doctorId" required>
                  <option value="">Choose a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.doctorID} value={doctor.doctorID}>
                      {doctor.title} {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label>From Time:</label>
                  <input 
                    type="time" 
                    value={bookingData.from}
                    onChange={(e) => setBookingData({...bookingData, from: e.target.value})}
                    required 
                  />
                </div>
                <div style={formGroupStyle}>
                  <label>To Time:</label>
                  <input 
                    type="time" 
                    value={bookingData.to}
                    onChange={(e) => setBookingData({...bookingData, to: e.target.value})}
                    required 
                  />
                </div>
              </div>
              
              <div style={formGroupStyle}>
                <label>Appointment Date:</label>
                <input 
                  type="date" 
                  value={bookingData.appointmentDate}
                  onChange={(e) => setBookingData({...bookingData, appointmentDate: e.target.value})}
                  required 
                />
              </div>
              
              <div style={formGroupStyle}>
                <label>Condition:</label>
                <input 
                  type="text" 
                  value={bookingData.condition}
                  onChange={(e) => setBookingData({...bookingData, condition: e.target.value})}
                  placeholder="Describe your condition"
                  required 
                />
              </div>
              
              <div style={formGroupStyle}>
                <label>Message:</label>
                <textarea 
                  value={bookingData.message}
                  onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                  placeholder="Additional information"
                  rows="3"
                />
              </div>
              
              <div style={buttonGroupStyle}>
                <button type="submit" style={primaryButtonStyle}>Book Appointment</button>
                <button type="button" onClick={() => setShowBookingForm(false)} style={secondaryButtonStyle}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <p><strong>Doctor:</strong> {appointment.doctor?.title} {appointment.doctor?.firstName} {appointment.doctor?.lastName}</p>
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
};

const PrescriptionsTab = ({ prescriptions }) => (
  <div style={tabContentStyle}>
    <h2>Prescriptions</h2>
    <div style={prescriptionsListStyle}>
      {prescriptions.map(prescription => (
        <div key={prescription.prescriptionId} style={prescriptionCardStyle}>
          <div style={prescriptionHeaderStyle}>
            <h4>Prescription #{prescription.prescriptionId}</h4>
            <span style={prescriptionDateStyle}>{prescription.date}</span>
          </div>
          <div style={prescriptionDetailsStyle}>
            <p><strong>Medicine:</strong> {prescription.medicine?.name}</p>
            <p><strong>Brand:</strong> {prescription.medicine?.brand}</p>
            <p><strong>Manufacturer:</strong> {prescription.medicine?.manufacturer}</p>
            <p><strong>Prescribed by:</strong> {prescription.doctor?.title} {prescription.doctor?.firstName} {prescription.doctor?.lastName}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OrdersTab = ({ orders }) => (
  <div style={tabContentStyle}>
    <h2>Order History</h2>
    <div style={ordersListStyle}>
      {orders.map((order, index) => (
        <div key={index} style={orderCardStyle}>
          <div style={orderHeaderStyle}>
            <h4>Order #{index + 1}</h4>
            <span style={orderDateStyle}>{new Date(order.date * 1000).toLocaleDateString()}</span>
          </div>
          <div style={orderDetailsStyle}>
            <p><strong>Medicine:</strong> {order.medicine?.name}</p>
            <p><strong>Quantity:</strong> {order.quantity}</p>
            <p><strong>Price per unit:</strong> {order.price} ETH</p>
            <p><strong>Total Amount:</strong> {order.payAmount} ETH</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MarketplaceTab = ({ medicines, onBuyMedicine }) => {
  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (medicineId, quantity) => {
    setQuantities(prev => ({
      ...prev,
      [medicineId]: quantity
    }));
  };

  const handleBuy = (medicine) => {
    const quantity = quantities[medicine.medicineID] || 1;
    onBuyMedicine(medicine.medicineID, medicine.price, quantity);
  };

  return (
    <div style={tabContentStyle}>
      <h2>Medicine Marketplace</h2>
      <div style={medicinesGridStyle}>
        {medicines.filter(medicine => medicine.active).map(medicine => (
          <div key={medicine.medicineID} style={medicineCardStyle}>
            <img src={medicine.image} alt={medicine.name} style={medicineImageStyle} />
            <div style={medicineInfoStyle}>
              <h4>{medicine.name}</h4>
              <p><strong>Brand:</strong> {medicine.brand}</p>
              <p><strong>Manufacturer:</strong> {medicine.manufacturer}</p>
              <p><strong>Price:</strong> {medicine.price} ETH</p>
              <p><strong>Available:</strong> {medicine.quantity}</p>
              <p><strong>Discount:</strong> {medicine.discount}%</p>
              <p><strong>Location:</strong> {medicine.currentLocation}</p>
              
              <div style={purchaseSectionStyle}>
                <div style={quantitySectionStyle}>
                  <label>Quantity:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={medicine.quantity}
                    value={quantities[medicine.medicineID] || 1}
                    onChange={(e) => handleQuantityChange(medicine.medicineID, parseInt(e.target.value))}
                    style={quantityInputStyle}
                  />
                </div>
                <button 
                  onClick={() => handleBuy(medicine)}
                  style={buyButtonStyle}
                  disabled={medicine.quantity === 0}
                >
                  Buy Now
                </button>
              </div>
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

const patientInfoStyle = {
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

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
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

const formRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px'
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '20px'
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

const appointmentStatusStyle = (isOpen) => ({
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
  gap: '10px'
};

const prescriptionsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const prescriptionCardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#f8f9fa'
};

const prescriptionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const prescriptionDateStyle = {
  color: '#6c757d',
  fontSize: '14px'
};

const prescriptionDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '10px'
};

const ordersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const orderCardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#f8f9fa'
};

const orderHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const orderDateStyle = {
  color: '#6c757d',
  fontSize: '14px'
};

const orderDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '10px'
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

const purchaseSectionStyle = {
  marginTop: '15px',
  padding: '15px',
  backgroundColor: 'white',
  borderRadius: '6px',
  border: '1px solid #dee2e6'
};

const quantitySectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px'
};

const quantityInputStyle = {
  width: '80px',
  padding: '5px',
  border: '1px solid #dee2e6',
  borderRadius: '4px'
};

const buyButtonStyle = {
  width: '100%',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '10px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const loadingStyle = {
  display: 'flex',
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

export default PatientDashboard;
