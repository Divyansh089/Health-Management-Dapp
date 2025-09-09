import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStateContext } from '../../Context/index.jsx';
import { UPLOAD_IPFS_IMAGE } from '../../Context/constants.jsx';
import { FaUserMd, FaUserInjured, FaUpload, FaSpinner } from 'react-icons/fa';
import '../styles/RegisterUser.css';

const RegisterUser = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ADD_DOCTOR, ADD_PATIENTS, GET_ALL_APPROVE_DOCTORS, loader } = useStateContext();
  
  const userType = searchParams.get('type') || 'patient';
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    // Common fields
    title: '',
    firstName: '',
    lastName: '',
    gender: '',
    yourAddress: '',
    mobile: '',
    emailID: '',
    image: '',
    walletAddress: '',
    
    // Doctor specific fields
    degrer: '',
    designation: '',
    lastWork: '',
    collageName: '',
    collageID: '',
    joiningYear: '',
    endYear: '',
    specialization: '',
    registrationID: '',
    collageAddress: '',
    biography: '',
    
    // Patient specific fields
    medicialHistory: '',
    birth: '',
    message: '',
    city: ''
  });

  useEffect(() => {
    if (userType === 'patient') {
      fetchDoctors();
    }
  }, [userType]);

  const fetchDoctors = async () => {
    try {
      const doctorsList = await GET_ALL_APPROVE_DOCTORS();
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      try {
        const url = await UPLOAD_IPFS_IMAGE(file);
        setImageUrl(url);
        setFormData(prev => ({ ...prev, image: url }));
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userType === 'doctor') {
      await handleDoctorRegistration();
    } else {
      await handlePatientRegistration();
    }
  };

  const handleDoctorRegistration = async () => {
    const doctorData = {
      ...formData,
      walletAddress: formData.walletAddress || window.ethereum?.selectedAddress
    };
    
    await ADD_DOCTOR(doctorData);
  };

  const handlePatientRegistration = async () => {
    if (!selectedDoctor) {
      alert('Please select a doctor');
      return;
    }

    const patientData = {
      ...formData,
      walletAddress: formData.walletAddress || window.ethereum?.selectedAddress
    };
    
    await ADD_PATIENTS(patientData, selectedDoctor);
  };

  const renderDoctorForm = () => (
    <div style={formContainerStyle}>
      <h2 style={titleStyle}>
        <FaUserMd style={{ marginRight: '10px' }} />
        Doctor Registration
      </h2>
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>Title *</label>
            <select name="title" value={formData.title} onChange={handleInputChange} required>
              <option value="">Select Title</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
            </select>
          </div>
          
          <div style={inputGroupStyle}>
            <label>First Name *</label>
            <input 
              type="text" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Last Name *</label>
            <input 
              type="text" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div style={inputGroupStyle}>
            <label>Degree *</label>
            <input 
              type="text" 
              name="degrer" 
              value={formData.degrer} 
              onChange={handleInputChange} 
              placeholder="e.g., MBBS, MD, PhD"
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Specialization *</label>
            <input 
              type="text" 
              name="specialization" 
              value={formData.specialization} 
              onChange={handleInputChange} 
              placeholder="e.g., Cardiology, Neurology"
              required 
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>Designation *</label>
            <input 
              type="text" 
              name="designation" 
              value={formData.designation} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Last Work Place *</label>
            <input 
              type="text" 
              name="lastWork" 
              value={formData.lastWork} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Registration ID *</label>
            <input 
              type="text" 
              name="registrationID" 
              value={formData.registrationID} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>College Name *</label>
            <input 
              type="text" 
              name="collageName" 
              value={formData.collageName} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>College ID *</label>
            <input 
              type="text" 
              name="collageID" 
              value={formData.collageID} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Joining Year *</label>
            <input 
              type="number" 
              name="joiningYear" 
              value={formData.joiningYear} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>End Year *</label>
            <input 
              type="number" 
              name="endYear" 
              value={formData.endYear} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Mobile *</label>
            <input 
              type="tel" 
              name="mobile" 
              value={formData.mobile} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Email *</label>
            <input 
              type="email" 
              name="emailID" 
              value={formData.emailID} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label>Address *</label>
          <textarea 
            name="yourAddress" 
            value={formData.yourAddress} 
            onChange={handleInputChange} 
            rows="3"
            required 
          />
        </div>

        <div style={inputGroupStyle}>
          <label>College Address *</label>
          <textarea 
            name="collageAddress" 
            value={formData.collageAddress} 
            onChange={handleInputChange} 
            rows="3"
            required 
          />
        </div>

        <div style={inputGroupStyle}>
          <label>Biography *</label>
          <textarea 
            name="biography" 
            value={formData.biography} 
            onChange={handleInputChange} 
            rows="4"
            placeholder="Tell us about your medical experience and expertise..."
            required 
          />
        </div>

        <div style={inputGroupStyle}>
          <label>Profile Image *</label>
          <div style={imageUploadStyle}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={uploadButtonStyle}>
              <FaUpload style={{ marginRight: '8px' }} />
              {imageFile ? 'Change Image' : 'Upload Image'}
            </label>
            {imageUrl && (
              <img src={imageUrl} alt="Profile" style={previewImageStyle} />
            )}
          </div>
        </div>

        <button type="submit" style={submitButtonStyle} disabled={loader}>
          {loader ? <FaSpinner className="fa-spin" /> : 'Register as Doctor'}
        </button>
      </form>
    </div>
  );

  const renderPatientForm = () => (
    <div style={formContainerStyle}>
      <h2 style={titleStyle}>
        <FaUserInjured style={{ marginRight: '10px' }} />
        Patient Registration
      </h2>
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>Title *</label>
            <select name="title" value={formData.title} onChange={handleInputChange} required>
              <option value="">Select Title</option>
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>
          
          <div style={inputGroupStyle}>
            <label>First Name *</label>
            <input 
              type="text" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Last Name *</label>
            <input 
              type="text" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div style={inputGroupStyle}>
            <label>Date of Birth *</label>
            <input 
              type="date" 
              name="birth" 
              value={formData.birth} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>City *</label>
            <input 
              type="text" 
              name="city" 
              value={formData.city} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={inputGroupStyle}>
            <label>Mobile *</label>
            <input 
              type="tel" 
              name="mobile" 
              value={formData.mobile} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Email *</label>
            <input 
              type="email" 
              name="emailID" 
              value={formData.emailID} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label>Address *</label>
          <textarea 
            name="yourAddress" 
            value={formData.yourAddress} 
            onChange={handleInputChange} 
            rows="3"
            required 
          />
        </div>

        <div style={inputGroupStyle}>
          <label>Medical History *</label>
          <textarea 
            name="medicialHistory" 
            value={formData.medicialHistory} 
            onChange={handleInputChange} 
            rows="4"
            placeholder="Describe your medical history, allergies, current medications..."
            required 
          />
        </div>

        <div style={inputGroupStyle}>
          <label>Additional Message</label>
          <textarea 
            name="message" 
            value={formData.message} 
            onChange={handleInputChange} 
            rows="3"
            placeholder="Any additional information you'd like to share..."
          />
        </div>

        <div style={inputGroupStyle}>
          <label>Select Your Doctor *</label>
          <select 
            value={selectedDoctor?.doctorID || ''} 
            onChange={(e) => {
              const doctor = doctors.find(d => d.doctorID === parseInt(e.target.value));
              setSelectedDoctor(doctor);
            }}
            required
          >
            <option value="">Select a Doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.doctorID} value={doctor.doctorID}>
                {doctor.title} {doctor.firstName} {doctor.lastName} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label>Profile Image *</label>
          <div style={imageUploadStyle}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={uploadButtonStyle}>
              <FaUpload style={{ marginRight: '8px' }} />
              {imageFile ? 'Change Image' : 'Upload Image'}
            </label>
            {imageUrl && (
              <img src={imageUrl} alt="Profile" style={previewImageStyle} />
            )}
          </div>
        </div>

        <button type="submit" style={submitButtonStyle} disabled={loader}>
          {loader ? <FaSpinner className="fa-spin" /> : 'Register as Patient'}
        </button>
      </form>
    </div>
  );

  return (
    <div style={containerStyle}>
      {userType === 'doctor' ? renderDoctorForm() : renderPatientForm()}
    </div>
  );
};

// Styles
const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  padding: '20px'
};

const formContainerStyle = {
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '40px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '30px',
  color: '#333',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const formRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const imageUploadStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'flex-start'
};

const uploadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const previewImageStyle = {
  width: '100px',
  height: '100px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '2px solid #dee2e6'
};

const submitButtonStyle = {
  padding: '15px 30px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginTop: '20px'
};

export default RegisterUser;

