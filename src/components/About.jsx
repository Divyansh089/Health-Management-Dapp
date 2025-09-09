import React from 'react';
import { FaShieldAlt, FaUserMd, FaPills, FaComments, FaChartLine, FaMobileAlt, FaHeartbeat, FaRobot } from 'react-icons/fa';
import '../styles/About.css';

function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-header">
          <h2>About ERES</h2>
          <p className="about-subtitle">
            Decentralized Healthcare Management System - Revolutionizing healthcare through blockchain technology
          </p>
        </div>

        <div className="about-contentGrid">
          <div className="about-introSection">
            <h3 className="about-sectionTitle">Introduction</h3>
            <p className="about-text">
              ERES is a cutting-edge Decentralized Healthcare Management System designed to make healthcare secure, 
              transparent, and accessible. Traditional healthcare systems store patient data on centralized servers, 
              which can be vulnerable to hacking and data leaks. Patients often lose control over their medical 
              records and face difficulties in sharing them across hospitals or doctors.
            </p>
            <p className="about-text">
              Our platform leverages blockchain technology and IPFS (InterPlanetary File System) to create a 
              secure, decentralized ecosystem where patients have full control over their medical data, doctors 
              are verified and trusted, and medicines are genuine and traceable.
            </p>
          </div>

          <div className="about-featuresSection">
            <h3 className="about-sectionTitle">Key Features</h3>
            <div className="about-featuresGrid">
              <div className="about-featureCard">
                <FaShieldAlt className="about-featureIcon" />
                <h4>Secure Healthcare Records</h4>
                <p>Patient data is stored safely using blockchain and IPFS, ensuring privacy and protection against tampering.</p>
              </div>
              
              <div className="about-featureCard">
                <FaUserMd className="about-featureIcon" />
                <h4>Trusted Doctor Verification</h4>
                <p>Only verified and licensed doctors can access and provide healthcare services through our platform.</p>
              </div>
              
              <div className="about-featureCard">
                <FaComments className="about-featureIcon" />
                <h4>Seamless Patient-Doctor Interaction</h4>
                <p>Patients can book appointments, consult through secure chat, and receive digital prescriptions.</p>
              </div>
              
              <div className="about-featureCard">
                <FaPills className="about-featureIcon" />
                <h4>Medicine Marketplace</h4>
                <p>A decentralized platform to purchase genuine medicines securely using MetaMask and blockchain.</p>
              </div>
              
              <div className="about-featureCard">
                <FaChartLine className="about-featureIcon" />
                <h4>Transparency & Analytics</h4>
                <p>Doctor profiles, ratings, and patient reviews help patients make informed decisions.</p>
              </div>
              
              <div className="about-featureCard">
                <FaMobileAlt className="about-featureIcon" />
                <h4>User-Friendly Interface</h4>
                <p>Health record download, reminders for appointments and medicines, and multilingual support.</p>
              </div>
            </div>
          </div>

          <div className="about-scopeSection">
            <h3 className="about-sectionTitle">Platform Scope</h3>
            <div className="about-scopeGrid">
              <div className="about-scopeCard">
                <h4>For Patients</h4>
                <ul className="about-list">
                  <li>Secure storage of medical records</li>
                  <li>Easy appointment booking</li>
                  <li>Access to verified doctors</li>
                  <li>Purchase genuine medicines</li>
                  <li>Track medical history</li>
                </ul>
              </div>
              
              <div className="about-scopeCard">
                <h4>For Doctors</h4>
                <ul className="about-list">
                  <li>Patient management system</li>
                  <li>Prescription management</li>
                  <li>Appointment scheduling</li>
                  <li>Medical history access</li>
                  <li>Medicine verification</li>
                </ul>
              </div>
              
              <div className="about-scopeCard">
                <h4>For Healthcare Organizations</h4>
                <ul className="about-list">
                  <li>Doctor verification system</li>
                  <li>Medicine supply chain tracking</li>
                  <li>Patient data analytics</li>
                  <li>Compliance management</li>
                  <li>Quality assurance</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-futureSection">
            <h3 className="about-sectionTitle">Future Roadmap</h3>
            <div className="about-roadmapGrid">
              <div className="about-roadmapItem">
                <FaHeartbeat className="about-roadmapIcon" />
                <h4>Wearable Integration</h4>
                <p>Integration with wearable devices for real-time health monitoring and data collection.</p>
              </div>
              
              <div className="about-roadmapItem">
                <FaRobot className="about-roadmapIcon" />
                <h4>AI-Powered Healthcare</h4>
                <p>AI-based health prediction and personalized treatment recommendations using machine learning.</p>
              </div>
              
              <div className="about-roadmapItem">
                <FaMobileAlt className="about-roadmapIcon" />
                <h4>Mobile Application</h4>
                <p>Native mobile application version for wider accessibility and better user experience.</p>
              </div>
              
              <div className="about-roadmapItem">
                <FaChartLine className="about-roadmapIcon" />
                <h4>Healthcare Analytics</h4>
                <p>Advanced analytics and reporting for healthcare organizations and government bodies.</p>
              </div>
            </div>
          </div>

          <div className="about-techSection">
            <h3 className="about-sectionTitle">Technology Stack</h3>
            <div className="about-techGrid">
              <div className="about-techItem">
                <strong>Blockchain:</strong> Ethereum smart contracts for secure transactions
              </div>
              <div className="about-techItem">
                <strong>Storage:</strong> IPFS for decentralized file storage
              </div>
              <div className="about-techItem">
                <strong>Frontend:</strong> React.js with modern UI/UX design
              </div>
              <div className="about-techItem">
                <strong>Web3:</strong> MetaMask integration for wallet connectivity
              </div>
              <div className="about-techItem">
                <strong>Security:</strong> End-to-end encryption and data privacy
              </div>
              <div className="about-techItem">
                <strong>API:</strong> RESTful APIs for seamless integration
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
