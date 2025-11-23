import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { fetchDoctors, fetchPatients } from "../../../lib/queries.js";
import { NETWORK, ROLES } from "../../../lib/constants.js";
import useRole from "../../../hooks/useRole.js";
import ConnectModal from "../../../components/Wallet/ConnectModal.jsx";
import "./HomePage.css";

const achievements = [
  { label: "Instant Role Detection", detail: "Admins, doctors, and patients recognise automatically." },
  { label: "Appointments Completed", detail: "Over 1,200 on-chain visits coordinated in pilot clinics." },
  { label: "Secure Prescriptions", detail: "End-to-end visibility for medicine life-cycles." }
];

const reviews = [
  {
    role: "Doctor",
    name: "Dr. Priya K.",
    quote:
      "MediFuse lets me focus on patient care instead of paperwork. Approvals and prescriptions update instantly on-chain."
  },
  {
    role: "Patient",
    name: "Anil D.",
    quote:
      "Booking appointments is effortless. I can see my history and purchase prescribed medicines in one place."
  },
  {
    role: "Doctor",
    name: "Dr. Hritik S.",
    quote:
      "Transparent fee splits and performance stats help me build trust with patients and administrators alike."
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const { readonlyContract, account } = useWeb3();
  const { role, isLoading: roleLoading } = useRole();
  const [showConnectModal, setShowConnectModal] = useState(false);

  const feesQuery = useQuery({
    queryKey: ["home", "fees"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      const [doctorFee, patientFee, appointmentFee] = await Promise.all([
        readonlyContract.doctorRegFeeWei(),
        readonlyContract.patientRegFeeWei(),
        readonlyContract.appointmentFeeWei()
      ]);
      return {
        doctor: Number(ethers.formatEther(doctorFee)),
        patient: Number(ethers.formatEther(patientFee)),
        appointment: Number(ethers.formatEther(appointmentFee))
      };
    }
  });

  const summaryQuery = useQuery({
    queryKey: ["home", "summary"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      const [doctors, patients, medicines, appointments] = await Promise.all([
        fetchDoctors(readonlyContract),
        fetchPatients(readonlyContract),
        readonlyContract.medicineCount(),
        readonlyContract.appointmentCount()
      ]);
      return {
        doctors: doctors.length,
        patients: patients.length,
        medicines: Number(medicines),
        appointments: Number(appointments)
      };
    }
  });

  useEffect(() => {
    if (account && role) {
      setShowConnectModal(false);
      const destination =
        role === ROLES.ADMIN ? "/admin" : role === ROLES.DOCTOR ? "/doctor" : role === ROLES.PATIENT ? "/patient" : "/";
      if (destination !== "/") {
        navigate(destination, { replace: true });
      }
    }
  }, [account, role, navigate]);

  const heroStats = useMemo(
    () => [
      { label: "Doctors", value: summaryQuery.data?.doctors ?? "..." },
      { label: "Patients", value: summaryQuery.data?.patients ?? "..." },
      { label: "Medicines", value: summaryQuery.data?.medicines ?? "..." },
      { label: "Appointments", value: summaryQuery.data?.appointments ?? "..." }
    ],
    [summaryQuery.data]
  );

  return (
    <section className="home-page">
      <div className="hero">
        <div className="hero-copy">
          <h1>MediFuse Care</h1>
          <p>
            The role-aware healthcare network for Holesky. Connect your wallet to unlock seamless coordination between administrators, doctors, and patients.
          </p>
          <div className="hero-network">
            <span className="network-badge">Powered by {NETWORK.toUpperCase()}</span>
            <p>
              Fast, low-cost transactions mean instant approvals, transparent payouts, and reliable medical records anchored on Ethereum.
            </p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                if (account && role && !roleLoading) {
                  const destination =
                    role === ROLES.ADMIN ? "/admin" : role === ROLES.DOCTOR ? "/doctor" : "/patient";
                  navigate(destination);
                  return;
                }
                setShowConnectModal(true);
              }}
            >
              Get Started
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-icon doctor-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span>Doctors</span>
            <strong>{heroStats[0].value}</strong>
          </div>
          <div className="stat">
            <div className="stat-icon patient-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span>Patients</span>
            <strong>{heroStats[1].value}</strong>
          </div>
          <div className="stat">
            <div className="stat-icon medicine-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <span>Medicines</span>
            <strong>{heroStats[2].value}</strong>
          </div>
          <div className="stat">
            <div className="stat-icon appointment-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
              </svg>
            </div>
            <span>Appointments</span>
            <strong>{heroStats[3].value}</strong>
          </div>
        </div>
      </div>

      <section id="achievements" className="achievements-panel">
        <h2>Why Teams Choose MediFuse</h2>
        <div className="achievement-grid">
          {achievements.map((item) => (
            <article key={item.label} className="achievement-card">
              <h4>{item.label}</h4>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {feesQuery.isError && <p className="error-text">Unable to load fee configuration. Try reconnecting.</p>}

      <section id="fees" className="fees-panel">
        <h2>Network Fees</h2>
        <p className="fees-subtext">
          Transparent and sustainable rates keep care affordable while rewarding medical experts for their time.
        </p>
        <div className="fee-grid">
          <div className="fee-card">
            <span>Doctor Registration</span>
            <strong>{feesQuery.data?.doctor?.toFixed(4) ?? "..."} ETH</strong>
          </div>
          <div className="fee-card">
            <span>Patient Registration</span>
            <strong>{feesQuery.data?.patient?.toFixed(4) ?? "..."} ETH</strong>
          </div>
          <div className="fee-card">
            <span>Appointment Booking</span>
            <strong>{feesQuery.data?.appointment?.toFixed(4) ?? "..."} ETH</strong>
          </div>
        </div>
      </section>

      <section id="impact" className="live-metrics">
        <div className="metrics-card">
          <h3>Live Onboarding</h3>
          <p>
            Plug into a ready-to-run ecosystem where each participant sees only the data they need. MediFuse automatically routes activity based on wallet role, unlocking faster approvals and healthier patient experiences.
          </p>
        </div>
        <div className="metrics-card">
          <h3>10x Faster Operations</h3>
          <p>
            Compared to traditional hospital admin, clinics piloting MediFuse reduced onboarding tasks from days to minutes and cut paperwork by 70%.
          </p>
        </div>
      </section>

      <section id="community" className="community-panel">
        <div className="community-header">
          <h2>What Our Community Says</h2>
          <p>Trusted by healthcare professionals and patients worldwide</p>
        </div>
        <div className="community-grid">
          <div className="community-card">
            <div className="community-avatar">
              <img src="/patients/1.jpg" alt="Dr. Priya K." />
            </div>
            <div className="community-content">
              <h4>Dr. Priya K.</h4>
              <span className="community-role">Cardiologist</span>
              <p>"MediFuse lets me focus on patient care instead of paperwork. Approvals and prescriptions update instantly on-chain."</p>
            </div>
          </div>
          <div className="community-card">
            <div className="community-avatar">
              <img src="/patients/2.jpg" alt="Anil D." />
            </div>
            <div className="community-content">
              <h4>Anil D.</h4>
              <span className="community-role">Patient</span>
              <p>"Booking appointments is effortless. I can see my history and purchase prescribed medicines in one place."</p>
            </div>
          </div>
          <div className="community-card">
            <div className="community-avatar">
              <img src="/patients/3.jpg" alt="Dr. Hritik S." />
            </div>
            <div className="community-content">
              <h4>Dr. Hritik S.</h4>
              <span className="community-role">General Physician</span>
              <p>"Transparent fee splits and performance stats help me build trust with patients and administrators alike."</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h4>MediFuse Care</h4>
            <p>Building trust in decentralized healthcare, one appointment at a time.</p>
            <div className="footer-social">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <span className="footer-title">Resources</span>
              <Link to="/public/medicines">Browse Medicines</Link>
              <Link to="/public/doctors">Find Doctors</Link>
              <a href="#achievements">Highlights</a>
              <a href="#fees">Network Fees</a>
            </div>
            <div className="footer-column">
              <span className="footer-title">Support</span>
              <a href="mailto:support@medifuse.io">support@medifuse.io</a>
              <a href="https://github.com" target="_blank" rel="noreferrer">Documentation</a>
              <a href="#community">Community</a>
              <a href="#impact">Impact</a>
            </div>
            <div className="footer-column">
              <span className="footer-title">Legal</span>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MediFuse Care. All rights reserved.</p>
          <p className="footer-network">Powered by Ethereum • Holesky Testnet</p>
        </div>
      </footer>

      <ConnectModal open={showConnectModal && (!account || !role)} onClose={() => setShowConnectModal(false)} />
    </section>
  );
}
