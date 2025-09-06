import React from 'react';

function Marketplace() {
  const medicines = [
    { name: 'Paracetamol', price: '₹50' },
    { name: 'Ibuprofen', price: '₹80' },
    { name: 'Amoxicillin', price: '₹120' },
    { name: 'Cetirizine', price: '₹40' },
    { name: 'Azithromycin', price: '₹150' },
    { name: 'Vitamin C', price: '₹60' },
    { name: 'Metformin', price: '₹90' },
    { name: 'Omeprazole', price: '₹70' },
  ];

  return (
    <section id="marketplace" style={{ padding: '50px', backgroundColor: '#f4f4f4', textAlign: 'center' }}>
      <h2>Medicine Marketplace</h2>
      <p>Buy genuine medicines securely using MetaMask.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        {medicines.map((med, index) => (
          <div key={index} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', width: '200px' }}>
            <h3>{med.name}</h3>
            <p>Price: {med.price}</p>
            <button style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Marketplace;
