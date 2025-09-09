
import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import { 
  GET_PATIENT_DETAILS, 
  GET_PATIENT_APPOINTMENT_HISTORYS, 
  GET_ALL_PRESCRIBED_MEDICINES_OF_PATIENT,
  GET_ALL_PATIENT_ORDERS,
  GET_ALL_REGISTERED_MEDICINES
} from '../../Context/constants.jsx';
import { FaCalendarAlt, FaPills, FaShoppingCart, FaUser, FaHistory, FaPlus, FaComments, FaBell } from 'react-icons/fa';
import '../styles/PatientDashboard.css';

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
      <div className="patientdashboard-loading">
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="patientdashboard-error">
        <div>Error loading patient data. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="patientdashboard-container">
      <div className="patientdashboard-header">
        <h1>Patient Dashboard</h1>
        <div className="patientdashboard-patientInfo">
          <img src={patientData.image} alt="Profile" className="patientdashboard-profileImage" />
          <div>
            <h2>{patientData.title} {patientData.firstName} {patientData.lastName}</h2>
            <p>Patient ID: {patientData.patientID}</p>
            <p>City: {patientData.city}</p>
          </div>
        </div>
      </div>

      <div className="patientdashboard-tabs">
        <button 
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaUser style={{ marginRight: '8px' }} />
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          className={activeTab === 'appointments' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaCalendarAlt style={{ marginRight: '8px' }} />
          Appointments
        </button>
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={activeTab === 'prescriptions' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaPills style={{ marginRight: '8px' }} />
          Prescriptions
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaHistory style={{ marginRight: '8px' }} />
          Orders
        </button>
        <button 
          onClick={() => setActiveTab('marketplace')}
          className={activeTab === 'marketplace' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaShoppingCart style={{ marginRight: '8px' }} />
          Marketplace
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={activeTab === 'chat' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaComments style={{ marginRight: '8px' }} />
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={activeTab === 'notifications' ? 'patientdashboard-activeTab' : 'patientdashboard-tab'}
        >
          <FaBell style={{ marginRight: '8px' }} />
          Notifications
        </button>
      </div>

      <div className="patientdashboard-content">
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
          <div className="patientdashboard-tabContent">
            <h2>Chat System</h2>
            <p>Access the chat system to communicate with doctors and other users.</p>
            <button 
              onClick={() => window.location.href = '/chat'}
              className="patientdashboard-primaryButton"
            >
              Open Chat System
            </button>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="patientdashboard-tabContent">
            <h2>Notifications</h2>
            <p>View your notifications and stay updated with important information.</p>
            <button 
              onClick={() => window.location.href = '/notifications'}
              className="patientdashboard-primaryButton"
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

// Styles - moved to PatientDashboard.css

export default PatientDashboard;
