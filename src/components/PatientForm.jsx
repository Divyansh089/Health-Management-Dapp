import React, { useState } from 'react';

function PatientForm() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
    symptoms: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form Submitted!\n' + JSON.stringify(formData, null, 2));
    // Here you can later integrate blockchain/IPFS storage
  };

  return (
    <section style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Patient Registration</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '20px auto', textAlign: 'left' }}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />

        <label>Age:</label>
        <input type="number" name="age" value={formData.age} onChange={handleChange} required style={inputStyle} />

        <label>Gender:</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required style={inputStyle}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <label>Contact Number:</label>
        <input type="text" name="contact" value={formData.contact} onChange={handleChange} required style={inputStyle} />

        <label>Symptoms / Health Issues:</label>
        <textarea name="symptoms" value={formData.symptoms} onChange={handleChange} required style={textareaStyle}></textarea>

        <button type="submit" style={buttonStyle}>Submit</button>
      </form>
    </section>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  margin: '5px 0 15px 0',
  borderRadius: '5px',
  border: '1px solid #ccc',
};

const textareaStyle = {
  width: '100%',
  padding: '10px',
  margin: '5px 0 15px 0',
  borderRadius: '5px',
  border: '1px solid #ccc',
  minHeight: '80px',
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

export default PatientForm;
