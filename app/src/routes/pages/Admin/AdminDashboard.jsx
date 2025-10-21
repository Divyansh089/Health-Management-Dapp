import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import "./Admin.css";

// Tiny inline sparkline renderer (no external libs)
function Sparkline({ points = [] }) {
  if (!points.length) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = (v) => (max === min ? 50 : 100 - ((v - min) / (max - min)) * 100);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * 100},${norm(v)}`)
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={d} className="sparkline-path" />
      <path
        d={`${d} L100,100 L0,100 Z`}
        className="sparkline-fill"
        fill="url(#sparkGradient)"
      />
    </svg>
  );
}

export default function AdminDashboard() {
  const { readonlyContract } = useWeb3();

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return null;
      const [doctorCount, patientCount, appointmentCount, prescriptionCount, medicineCount] =
        await Promise.all([
          readonlyContract.doctorCount(),
          readonlyContract.patientCount(),
          readonlyContract.appointmentCount(),
          readonlyContract.prescriptionCount(),
          readonlyContract.medicineCount()
        ]);
      return {
        doctorCount: Number(doctorCount),
        patientCount: Number(patientCount),
        appointmentCount: Number(appointmentCount),
        prescriptionCount: Number(prescriptionCount),
        medicineCount: Number(medicineCount)
      };
    }
  });

  const stats = useMemo(
    () => [
      { label: "Doctors", value: statsQuery.data?.doctorCount ?? 0, icon: "🩺" },
      { label: "Patients", value: statsQuery.data?.patientCount ?? 0, icon: "🧑‍⚕️" },
      { label: "Medicines", value: statsQuery.data?.medicineCount ?? 0, icon: "💊" },
      { label: "Appointments", value: statsQuery.data?.appointmentCount ?? 0, icon: "📅" },
      { label: "Prescriptions", value: statsQuery.data?.prescriptionCount ?? 0, icon: "📝" }
    ],
    [statsQuery.data]
  );

  // Mock activity chart data (replace with real series later)
  const activityPoints = [5, 9, 7, 11, 13, 8, 15, 14, 18, 16, 22, 20];

  return (
    <section className="page admin-dashboard">
      <div className="dash-hero">
        <div className="dash-hero-content">
          <h2>
            Admin Dashboard
            <span className="dash-gradient-text"> • MediFuse</span>
          </h2>
          <p>High‑level view across roles, inventory, and activity.</p>
          <div className="dash-quick-actions">
            <a className="qa-btn" href="/admin/add-medicine">➕ Add Medicine</a>
            <a className="qa-btn alt" href="/admin/fees">💸 Update Fees</a>
            <a className="qa-btn ghost" href="/admin/activity">📈 View Activity</a>
          </div>
        </div>
        <div className="dash-hero-blob" aria-hidden />
      </div>

      <div className="stats-grid kpi-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="kpi-card">
            <div className="kpi-icon" aria-hidden>{stat.icon}</div>
            <div className="kpi-meta">
              <span className="stat-label">{stat.label}</span>
              <strong className="stat-value">
                {statsQuery.isLoading ? "…" : stat.value.toLocaleString()}
              </strong>
            </div>
          </div>
        ))}
      </div>

      <div className="card-grid">
        <div className="panel fancy-panel">
          <h3>Weekly Activity</h3>
          <div className="sparkline-wrap">
            <Sparkline points={activityPoints} />
          </div>
          <div className="panel-footer-text">Live on‑chain activity trend (demo)</div>
        </div>

        <div className="panel fancy-panel">
          <h3>Shortcuts</h3>
          <div className="shortcuts-grid">
            <a className="shortcut-tile" href="/admin/doctors">🩺 Manage Doctors</a>
            <a className="shortcut-tile" href="/admin/patients">👥 Manage Patients</a>
            <a className="shortcut-tile" href="/admin/medicines">💊 Manage Medicines</a>
            <a className="shortcut-tile" href="/admin/activity">🧭 System Activity</a>
          </div>
        </div>
      </div>
    </section>
  );
}
