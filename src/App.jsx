import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StateContextProvider } from '../Context/index.jsx';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Doctors from './components/Doctors';
import Marketplace from './components/Marketplace';
import Footer from './components/Footer';
import PatientForm from './components/PatientForm';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import PatientDashboard from './components/PatientDashboard';
import RegisterUser from './components/RegisterUser';
import ChatSystem from './components/ChatSystem';
import NotificationSystem from './components/NotificationSystem';

function App() {
  return (
    <StateContextProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        {/* Main content should grow to fill available space */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patient" element={<PatientForm />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/chat" element={<ChatSystem />} />
            <Route path="/notifications" element={<NotificationSystem />} />
            <Route path="/about" element={<About />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/marketplace" element={<Marketplace />} />
          </Routes>
        </div>

        <Footer />
        <Toaster position="top-right" />
      </div>
    </StateContextProvider>
  );
}

export default App;
