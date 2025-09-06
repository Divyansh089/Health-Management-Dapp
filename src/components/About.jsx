import React from 'react';
import { FaShieldAlt, FaUserMd, FaPills, FaComments, FaChartLine, FaMobileAlt, FaHeartbeat, FaRobot } from 'react-icons/fa';

function About() {
  return (
    <section id="about" style={sectionStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2>About ERES</h2>
          <p style={subtitleStyle}>
            Decentralized Healthcare Management System - Revolutionizing healthcare through blockchain technology
          </p>
        </div>

        <div style={contentGridStyle}>
          <div style={introSectionStyle}>
            <h3 style={sectionTitleStyle}>Introduction</h3>
            <p style={textStyle}>
              ERES is a cutting-edge Decentralized Healthcare Management System designed to make healthcare secure, 
              transparent, and accessible. Traditional healthcare systems store patient data on centralized servers, 
              which can be vulnerable to hacking and data leaks. Patients often lose control over their medical 
              records and face difficulties in sharing them across hospitals or doctors.
            </p>
            <p style={textStyle}>
              Our platform leverages blockchain technology and IPFS (InterPlanetary File System) to create a 
              secure, decentralized ecosystem where patients have full control over their medical data, doctors 
              are verified and trusted, and medicines are genuine and traceable.
            </p>
          </div>

          <div style={featuresSectionStyle}>
            <h3 style={sectionTitleStyle}>Key Features</h3>
            <div style={featuresGridStyle}>
              <div style={featureCardStyle}>
                <FaShieldAlt style={featureIconStyle} />
                <h4>Secure Healthcare Records</h4>
                <p>Patient data is stored safely using blockchain and IPFS, ensuring privacy and protection against tampering.</p>
              </div>
              
              <div style={featureCardStyle}>
                <FaUserMd style={featureIconStyle} />
                <h4>Trusted Doctor Verification</h4>
                <p>Only verified and licensed doctors can access and provide healthcare services through our platform.</p>
              </div>
              
              <div style={featureCardStyle}>
                <FaComments style={featureIconStyle} />
                <h4>Seamless Patient-Doctor Interaction</h4>
                <p>Patients can book appointments, consult through secure chat, and receive digital prescriptions.</p>
              </div>
              
              <div style={featureCardStyle}>
                <FaPills style={featureIconStyle} />
                <h4>Medicine Marketplace</h4>
                <p>A decentralized platform to purchase genuine medicines securely using MetaMask and blockchain.</p>
              </div>
              
              <div style={featureCardStyle}>
                <FaChartLine style={featureIconStyle} />
                <h4>Transparency & Analytics</h4>
                <p>Doctor profiles, ratings, and patient reviews help patients make informed decisions.</p>
              </div>
              
              <div style={featureCardStyle}>
                <FaMobileAlt style={featureIconStyle} />
                <h4>User-Friendly Interface</h4>
                <p>Health record download, reminders for appointments and medicines, and multilingual support.</p>
              </div>
            </div>
          </div>

          <div style={scopeSectionStyle}>
            <h3 style={sectionTitleStyle}>Platform Scope</h3>
            <div style={scopeGridStyle}>
              <div style={scopeCardStyle}>
                <h4>For Patients</h4>
                <ul style={listStyle}>
                  <li>Secure storage of medical records</li>
                  <li>Easy appointment booking</li>
                  <li>Access to verified doctors</li>
                  <li>Purchase genuine medicines</li>
                  <li>Track medical history</li>
                </ul>
              </div>
              
              <div style={scopeCardStyle}>
                <h4>For Doctors</h4>
                <ul style={listStyle}>
                  <li>Patient management system</li>
                  <li>Prescription management</li>
                  <li>Appointment scheduling</li>
                  <li>Medical history access</li>
                  <li>Medicine verification</li>
                </ul>
              </div>
              
              <div style={scopeCardStyle}>
                <h4>For Healthcare Organizations</h4>
                <ul style={listStyle}>
                  <li>Doctor verification system</li>
                  <li>Medicine supply chain tracking</li>
                  <li>Patient data analytics</li>
                  <li>Compliance management</li>
                  <li>Quality assurance</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={futureSectionStyle}>
            <h3 style={sectionTitleStyle}>Future Roadmap</h3>
            <div style={roadmapGridStyle}>
              <div style={roadmapItemStyle}>
                <FaHeartbeat style={roadmapIconStyle} />
                <h4>Wearable Integration</h4>
                <p>Integration with wearable devices for real-time health monitoring and data collection.</p>
              </div>
              
              <div style={roadmapItemStyle}>
                <FaRobot style={roadmapIconStyle} />
                <h4>AI-Powered Healthcare</h4>
                <p>AI-based health prediction and personalized treatment recommendations using machine learning.</p>
              </div>
              
              <div style={roadmapItemStyle}>
                <FaMobileAlt style={roadmapIconStyle} />
                <h4>Mobile Application</h4>
                <p>Native mobile application version for wider accessibility and better user experience.</p>
              </div>
              
              <div style={roadmapItemStyle}>
                <FaChartLine style={roadmapIconStyle} />
                <h4>Healthcare Analytics</h4>
                <p>Advanced analytics and reporting for healthcare organizations and government bodies.</p>
              </div>
            </div>
          </div>

          <div style={techSectionStyle}>
            <h3 style={sectionTitleStyle}>Technology Stack</h3>
            <div style={techGridStyle}>
              <div style={techItemStyle}>
                <strong>Blockchain:</strong> Ethereum smart contracts for secure transactions
              </div>
              <div style={techItemStyle}>
                <strong>Storage:</strong> IPFS for decentralized file storage
              </div>
              <div style={techItemStyle}>
                <strong>Frontend:</strong> React.js with modern UI/UX design
              </div>
              <div style={techItemStyle}>
                <strong>Web3:</strong> MetaMask integration for wallet connectivity
              </div>
              <div style={techItemStyle}>
                <strong>Security:</strong> End-to-end encryption and data privacy
              </div>
              <div style={techItemStyle}>
                <strong>API:</strong> RESTful APIs for seamless integration
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Styles
const sectionStyle = {
  padding: '50px 20px',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh'
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '50px'
};

const subtitleStyle = {
  fontSize: '18px',
  color: '#666',
  marginTop: '10px',
  maxWidth: '600px',
  margin: '10px auto 0'
};

const contentGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '40px'
};

const introSectionStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const featuresSectionStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const scopeSectionStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const futureSectionStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const techSectionStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const sectionTitleStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#333',
  borderBottom: '2px solid #007bff',
  paddingBottom: '10px'
};

const textStyle = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#666',
  marginBottom: '15px'
};

const featuresGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginTop: '20px'
};

const featureCardStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'center',
  transition: 'transform 0.3s ease'
};

const featureIconStyle = {
  fontSize: '32px',
  color: '#007bff',
  marginBottom: '15px'
};

const scopeGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginTop: '20px'
};

const scopeCardStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6'
};

const listStyle = {
  listStyleType: 'disc',
  paddingLeft: '20px',
  marginTop: '10px'
};

const roadmapGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginTop: '20px'
};

const roadmapItemStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'center'
};

const roadmapIconStyle = {
  fontSize: '28px',
  color: '#28a745',
  marginBottom: '15px'
};

const techGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '15px',
  marginTop: '20px'
};

const techItemStyle = {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #dee2e6',
  fontSize: '14px'
};

export default About;
