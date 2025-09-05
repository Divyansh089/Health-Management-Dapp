import React from 'react';

function About() {
  return (
    <section id="about" style={{ padding: '50px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>About ERES</h2>

      <h3>Introduction</h3>
      <p>
        ERES – Decentralized Healthcare Management System is designed to make healthcare secure, transparent, and accessible. 
        Traditional healthcare systems store patient data on centralized servers, which can be vulnerable to hacking and data leaks. 
        Patients often lose control over their medical records and face difficulties in sharing them across hospitals or doctors.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li><strong>Secure Healthcare Records:</strong> Patient data is stored safely using blockchain and IPFS, ensuring privacy and protection against tampering.</li>
        <li><strong>Trusted Doctor Verification:</strong> Only verified and licensed doctors can access and provide healthcare services.</li>
        <li><strong>Seamless Patient-Doctor Interaction:</strong> Patients can book appointments, consult through secure chat, and receive digital prescriptions.</li>
        <li><strong>Medicine Marketplace:</strong> A decentralized platform to purchase genuine medicines securely using MetaMask.</li>
        <li><strong>Transparency:</strong> Doctor profiles, ratings, and patient reviews help patients make informed decisions.</li>
        <li><strong>User-Friendly Features:</strong> Health record download, reminders for appointments and medicines, and multilingual support.</li>
      </ul>

      <h3>Scope</h3>
      <p>
        ERES can be used by patients, doctors, and healthcare organizations. 
        It enhances data security, builds trust, and makes healthcare more digitally accessible. 
        In the future, the system can be expanded into a mobile application and integrated with wearable IoT devices for real-time health tracking.
      </p>

      <h3>Future Work</h3>
      <ul>
        <li>Integration with wearable devices for real-time health monitoring.</li>
        <li>AI-based health prediction and personalized treatment recommendations.</li>
        <li>Mobile application version for wider accessibility.</li>
        <li>Partnership with hospitals and government health organizations for large-scale adoption.</li>
      </ul>
    </section>
  );
}

export default About;
