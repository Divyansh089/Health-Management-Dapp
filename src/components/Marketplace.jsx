import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import { GET_ALL_REGISTERED_MEDICINES } from '../../Context/constants.jsx';
import { FaPills, FaShoppingCart, FaMapMarkerAlt, FaCalendarAlt, FaTag } from 'react-icons/fa';
import '../styles/Marketplace.css';

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
      <div className="marketplace-loading">
        <div className="marketplace-spinner"></div>
        <div className="marketplace-loadingText">Loading medicines...</div>
      </div>
    );
  }

  return (
    <section id="marketplace" className="marketplace-section">
      <div className="marketplace-container">
        <div className="marketplace-header">
          <h2 className="marketplace-title">
            <FaPills style={{ marginRight: '10px' }} />
            Medicine Marketplace
          </h2>
          <p className="marketplace-subtitle">Buy genuine medicines securely using blockchain technology.</p>
        </div>

        <div className="marketplace-controls">
          <input
            type="text"
            placeholder="Search medicines by name, brand, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="marketplace-searchBar"
          />
          
          <div className="marketplace-filters">
            <button
              onClick={() => setFilterActive(true)}
              className={`marketplace-filterBtn ${filterActive ? 'active' : ''}`}
            >
              Available Only
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`marketplace-filterBtn ${!filterActive ? 'active' : ''}`}
            >
              All Medicines
            </button>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="marketplace-emptyState">
            <FaPills className="marketplace-emptyIcon" />
            <h3 className="marketplace-emptyTitle">No medicines found</h3>
            <p className="marketplace-emptyText">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="marketplace-grid">
            {filteredMedicines.map((medicine) => (
              <div key={medicine.medicineID} className="marketplace-card">
                <div className="marketplace-cardHeader">
                  <div className="marketplace-medicineIcon">
                    <FaPills />
                  </div>
                  <div className={`marketplace-statusBadge ${medicine.active ? 'active' : 'inactive'}`}>
                    {medicine.active ? 'Available' : 'Out of Stock'}
                  </div>
                </div>
                
                <h3 className="marketplace-medicineName">{medicine.name}</h3>
                
                <div className="marketplace-manufacturerInfo">
                  <div className="marketplace-manufacturerLabel">Manufacturer</div>
                  <div className="marketplace-manufacturerName">{medicine.manufacturer}</div>
                </div>
                
                <div className="marketplace-medicineDetails">
                  <div className="marketplace-detailItem">
                    <FaCalendarAlt className="marketplace-detailIcon" />
                    <span className="marketplace-detailText">Mfg: {medicine.manufacturDate}</span>
                  </div>
                  <div className="marketplace-detailItem">
                    <FaCalendarAlt className="marketplace-detailIcon" />
                    <span className="marketplace-detailText">Exp: {medicine.expiryDate}</span>
                  </div>
                  <div className="marketplace-detailItem">
                    <FaMapMarkerAlt className="marketplace-detailIcon" />
                    <span className="marketplace-detailText">{medicine.currentLocation}</span>
                  </div>
                </div>

                <div className="marketplace-priceSection">
                  <div className="marketplace-price">
                    {medicine.price} ETH
                    {medicine.discount > 0 && (
                      <span className="marketplace-discount">
                        <FaTag /> {medicine.discount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="marketplace-priceLabel">per unit</div>
                </div>

                <div className="marketplace-quantitySection">
                  <label className="marketplace-quantityLabel">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max={medicine.quantity}
                    value={quantities[medicine.medicineID] || 1}
                    onChange={(e) => handleQuantityChange(medicine.medicineID, parseInt(e.target.value))}
                    className="marketplace-quantityInput"
                    disabled={!medicine.active}
                  />
                  <span className="marketplace-stockInfo">
                    {medicine.quantity} available
                  </span>
                </div>

                {medicine.active && medicine.quantity > 0 && (
                  <button
                    onClick={() => handleBuyMedicine(medicine)}
                    className="marketplace-buyBtn"
                    disabled={loader}
                  >
                    <FaShoppingCart />
                    {loader ? 'Processing...' : 'Buy Medicine'}
                  </button>
                )}
                
                {!medicine.active && (
                  <div className="marketplace-unavailable">
                    This medicine is currently unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Marketplace;
