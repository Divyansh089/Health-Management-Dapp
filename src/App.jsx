import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Doctors from './components/Doctors';
import Marketplace from './components/Marketplace';
import Footer from './components/Footer';
import PatientForm from './components/PatientForm';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Main content should grow to fill available space */}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patient" element={<PatientForm />} />
          <Route path="/about" element={<About />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
