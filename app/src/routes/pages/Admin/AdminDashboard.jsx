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

// Simple inline charts for analytics
function AreaChart({ series = [], color = "#3b82f6" }) {
  if (!series.length) return <div className="sparkline-wrap" />;
  const max = Math.max(...series.map((p) => p.v));
  const min = 0;
  const h = 100;
  const w = 100;
  const y = (v) => (max === min ? h / 2 : h - (v - min) * (h / (max - min)));
  const x = (i) => (series.length <= 1 ? 0 : (i / (series.length - 1)) * w);
  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.v)}`)
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={area} className="sparkline-fill" fill="url(#areaGrad)" />
      <path d={path} className="sparkline-path" stroke={color} />
    </svg>
  );
}

function BarChart({ series = [], color = "#22c55e" }) {
  const max = Math.max(1, ...series.map((p) => p.v));
  return (
    <div className="sparkline-wrap" style={{ display: "grid", gridTemplateColumns: `repeat(${series.length || 1}, 1fr)`, alignItems: "end", gap: 6 }}>
      {series.map((p, i) => (
        <div key={i} title={`${p.t}: ${p.v}`} style={{ background: color, height: `${(p.v / max) * 100}%`, borderRadius: 6, opacity: 0.9 }} />
      ))}
    </div>
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

  // Analytics: revenue and medicine-added series from events
  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return null;
      try {
        const from = 0;
        const boughtFilter = readonlyContract.filters.MedicineBought?.();
        const addedFilter = readonlyContract.filters.MedicineAdded?.();
        const [bought, added] = await Promise.all([
          readonlyContract.queryFilter(boughtFilter, from).catch(() => []),
          readonlyContract.queryFilter(addedFilter, from).catch(() => []),
        ]);

        let revenueWei = 0n;
        const byDay = new Map();
        for (const log of bought) {
          const args = log.args || [];
          const paid = args?.paidWei ?? args?.[3] ?? 0n;
          const ts = (await log.getBlock())?.timestamp ?? Math.floor(Date.now() / 1000);
          const day = new Date(ts * 1000).toISOString().slice(0, 10);
          revenueWei += BigInt(paid);
          byDay.set(day, (byDay.get(day) || 0n) + BigInt(paid));
        }

        const addedByDay = new Map();
        for (const log of added) {
          const ts = (await log.getBlock())?.timestamp ?? Math.floor(Date.now() / 1000);
          const day = new Date(ts * 1000).toISOString().slice(0, 10);
          addedByDay.set(day, (addedByDay.get(day) || 0) + 1);
        }

        const days = Array.from(new Set([...byDay.keys(), ...addedByDay.keys()])).sort();
        const revenueSeries = days.map((d) => ({ t: d.slice(5), v: Number((byDay.get(d) || 0n) / 10n ** 14n) / 100 }));
        const addedSeries = days.map((d) => ({ t: d.slice(5), v: addedByDay.get(d) || 0 }));

        return {
          totalRevenueEth: Number(revenueWei) / 1e18,
          revenueSeries,
          addedSeries,
          medicineAdded: added?.length || 0,
          purchases: bought?.length || 0,
        };
      } catch {
        return { totalRevenueEth: 0, revenueSeries: [], addedSeries: [], medicineAdded: 0, purchases: 0 };
      }
    },
  });

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

      <header className="page-header">
        <div>
          <h2>Analytics</h2>
          <p>Revenue, activity, and catalog growth at a glance.</p>
        </div>
      </header>

      <div className="stats-grid kpi-grid">
        {[{
          label: "Total Revenue (ETH)",
          value: analyticsQuery.data?.totalRevenueEth?.toFixed?.(4) ?? "0.0000",
          icon: "💰"
        }, {
          label: "Purchases",
          value: analyticsQuery.data?.purchases ?? 0,
          icon: "🛒"
        }, {
          label: "Medicines Added",
          value: analyticsQuery.data?.medicineAdded ?? 0,
          icon: "💊"
        }].map((k) => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-icon" aria-hidden>{k.icon}</div>
            <div className="kpi-meta">
              <span className="stat-label">{k.label}</span>
              <strong className="stat-value">{analyticsQuery.isLoading ? "…" : k.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="card-grid">
        <div className="panel fancy-panel">
          <h3>Revenue Over Time</h3>
          {analyticsQuery.isLoading ? (
            <div className="skeleton-card" />
          ) : (
            <AreaChart series={analyticsQuery.data?.revenueSeries || []} color="#1e88e5" />
          )}
          <div className="panel-footer-text">Sum of MedicineBought(paidWei), grouped by day</div>
        </div>

        <div className="panel fancy-panel">
          <h3>Medicines Added</h3>
          {analyticsQuery.isLoading ? (
            <div className="skeleton-card" />
          ) : (
            <BarChart series={analyticsQuery.data?.addedSeries || []} color="#22c55e" />
          )}
          <div className="panel-footer-text">Count of MedicineAdded events per day</div>
        </div>
      </div>
    </section>
  );
}
