import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index';
import { GET_ALL_REGISTERED_MEDICINES } from '../../Context/constants';
import { FaPills, FaShoppingCart, FaMapMarkerAlt, FaCalendarAlt, FaTag } from 'react-icons/fa';

function Marketplace() {
  const { address, BUY_MEDICINE, loader } = useStateContext();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const medicinesList = await GET_ALL_REGISTERED_MEDICINES();
      setMedicines(medicinesList);
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (medicineId, quantity) => {
    setQuantities(prev => ({
      ...prev,
      [medicineId]: quantity
    }));
  };

  const handleBuyMedicine = async (medicine) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    const quantity = quantities[medicine.medicineID] || 1;
    if (quantity > medicine.quantity) {
      alert('Not enough stock available');
      return;
    }

    try {
      await BUY_MEDICINE(medicine.medicineID, medicine.price, quantity);
      // Reset quantity after purchase
      setQuantities(prev => ({
        ...prev,
        [medicine.medicineID]: 1
      }));
    } catch (error) {
      console.error('Error buying medicine:', error);
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive ? medicine.active : true;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading medicines...</div>
      </div>
    );
  }

  return (
    <section id="marketplace" style={sectionStyle}>
      <div style={headerStyle}>
        <h2>
          <FaPills style={{ marginRight: '10px' }} />
          Medicine Marketplace
        </h2>
        <p>Buy genuine medicines securely using blockchain technology.</p>
      </div>

      <div style={filtersStyle}>
        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        
        <div style={filterContainerStyle}>
          <label style={filterLabelStyle}>
            <input
              type="checkbox"
              checked={filterActive}
              onChange={(e) => setFilterActive(e.target.checked)}
              style={checkboxStyle}
            />
            Show only active medicines
          </label>
        </div>
      </div>

      {filteredMedicines.length === 0 ? (
        <div style={emptyStateStyle}>
          <FaPills style={{ fontSize: '48px', color: '#6c757d', marginBottom: '20px' }} />
          <h3>No Medicines Found</h3>
          <p>No medicines match your search criteria.</p>
        </div>
      ) : (
        <div style={medicinesGridStyle}>
          {filteredMedicines.map((medicine) => (
            <div key={medicine.medicineID} style={medicineCardStyle}>
              <div style={medicineImageContainerStyle}>
                <img src={medicine.image} alt={medicine.name} style={medicineImageStyle} />
                <div style={statusBadgeStyle(medicine.active)}>
                  {medicine.active ? 'Available' : 'Out of Stock'}
                </div>
                {medicine.discount > 0 && (
                  <div style={discountBadgeStyle}>
                    <FaTag style={{ marginRight: '5px' }} />
                    {medicine.discount}% OFF
                  </div>
                )}
              </div>
              
              <div style={medicineInfoStyle}>
                <h3>{medicine.name}</h3>
                <p style={brandStyle}>{medicine.brand}</p>
                
                <div style={medicineDetailsStyle}>
                  <div style={detailItemStyle}>
                    <strong>Manufacturer:</strong> {medicine.manufacturer}
                  </div>
                  <div style={detailItemStyle}>
                    <strong>Manufacture Date:</strong> {medicine.manufacturDate}
                  </div>
                  <div style={detailItemStyle}>
                    <strong>Expiry Date:</strong> {medicine.expiryDate}
                  </div>
                  <div style={detailItemStyle}>
                    <FaMapMarkerAlt style={{ marginRight: '8px', color: '#007bff' }} />
                    <span>{medicine.currentLocation}</span>
                  </div>
                </div>
                
                <div style={pricingStyle}>
                  <div style={priceContainerStyle}>
                    <span style={priceStyle}>{medicine.price} ETH</span>
                    {medicine.discount > 0 && (
                      <span style={originalPriceStyle}>
                        {((medicine.price * 100) / (100 - medicine.discount)).toFixed(3)} ETH
                      </span>
                    )}
                  </div>
                  <div style={stockStyle}>
                    Stock: {medicine.quantity} units
                  </div>
                </div>
                
                <div style={descriptionStyle}>
                  <p>{medicine.description}</p>
                </div>
                
                {medicine.active && medicine.quantity > 0 && (
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
                      onClick={() => handleBuyMedicine(medicine)}
                      style={buyButtonStyle}
                      disabled={loader}
                    >
                      <FaShoppingCart style={{ marginRight: '8px' }} />
                      {loader ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                )}
                
                {!medicine.active && (
                  <div style={unavailableStyle}>
                    This medicine is currently unavailable
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Styles
const sectionStyle = {
  padding: '50px 20px',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '30px'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontSize: '18px'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '50px',
  color: '#6c757d'
};

const filtersStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  flexWrap: 'wrap',
  gap: '20px'
};

const searchContainerStyle = {
  flex: 1,
  minWidth: '300px'
};

const searchInputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.3s ease'
};

const filterContainerStyle = {
  display: 'flex',
  alignItems: 'center'
};

const filterLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#666',
  cursor: 'pointer'
};

const checkboxStyle = {
  width: '16px',
  height: '16px'
};

const medicinesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '30px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const medicineCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
};

const medicineImageContainerStyle = {
  position: 'relative',
  height: '250px',
  overflow: 'hidden'
};

const medicineImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const statusBadgeStyle = (isActive) => ({
  position: 'absolute',
  top: '15px',
  right: '15px',
  backgroundColor: isActive ? '#28a745' : '#dc3545',
  color: 'white',
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold'
});

const discountBadgeStyle = {
  position: 'absolute',
  top: '15px',
  left: '15px',
  backgroundColor: '#ffc107',
  color: 'black',
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center'
};

const medicineInfoStyle = {
  padding: '25px'
};

const brandStyle = {
  color: '#007bff',
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '15px'
};

const medicineDetailsStyle = {
  marginBottom: '20px'
};

const detailItemStyle = {
  marginBottom: '8px',
  fontSize: '14px',
  color: '#666',
  display: 'flex',
  alignItems: 'center'
};

const pricingStyle = {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px'
};

const priceContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '8px'
};

const priceStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#28a745'
};

const originalPriceStyle = {
  fontSize: '16px',
  color: '#6c757d',
  textDecoration: 'line-through'
};

const stockStyle = {
  fontSize: '14px',
  color: '#666'
};

const descriptionStyle = {
  marginBottom: '20px'
};

const descriptionStyle p = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666'
};

const purchaseSectionStyle = {
  borderTop: '1px solid #dee2e6',
  paddingTop: '20px'
};

const quantitySectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '15px'
};

const quantityInputStyle = {
  width: '80px',
  padding: '8px',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  textAlign: 'center'
};

const buyButtonStyle = {
  width: '100%',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.3s ease'
};

const unavailableStyle = {
  textAlign: 'center',
  padding: '20px',
  backgroundColor: '#f8d7da',
  color: '#721c24',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 'bold'
};

export default Marketplace;
