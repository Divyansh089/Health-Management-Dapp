import React from 'react';

function Doctors() {
  const doctors = [
    { name: 'Dr. A. Sharma', specialization: 'Cardiologist' },
    { name: 'Dr. P. Verma', specialization: 'Dermatologist' },
    { name: 'Dr. S. Gupta', specialization: 'Pediatrician' },
  ];

  return (
    <section id="doctors" style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Our Verified Doctors</h2>
      <p>Only licensed doctors can provide healthcare services here.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        {doctors.map((doc, index) => (
          <div key={index} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', width: '200px' }}>
            <h3>{doc.name}</h3>
            <p>{doc.specialization}</p>
            <button style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              View Profile
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
export default Doctors;
