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
            </button>
          </div>
        </div>
        <div className="hero-stats">
          {heroStats.map((stat) => (
            <div key={stat.label} className="stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
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

      <section id="reviews" className="reviews-panel">
        <h2>What Our Community Is Saying</h2>
        <div className="review-grid">
          {reviews.map((review) => (
            <figure key={review.name} className="review-card">
              <blockquote>"{review.quote}"</blockquote>
              <figcaption>
                <span className="review-name">{review.name}</span>
                <span className="review-role">{review.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div>
          <h4>MediFuse</h4>
          <p>Building trust in decentralised healthcare, one appointment at a time.</p>
        </div>
        <div>
          <span className="footer-title">Resources</span>
          <Link to="/public/medicines">Browse Medicines</Link>
          <Link to="/public/doctors">Find Doctors</Link>
        </div>
        <div>
          <span className="footer-title">Support</span>
          <a href="mailto:support@medifuse.io">support@medifuse.io</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </footer>

      <ConnectModal open={showConnectModal && (!account || !role)} onClose={() => setShowConnectModal(false)} />
    </section>
  );
}
