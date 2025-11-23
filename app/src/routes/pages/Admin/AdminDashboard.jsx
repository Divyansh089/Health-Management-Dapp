import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { fetchAllAppointments, fetchAllPrescriptions, fetchDoctors, fetchMedicines, formatEther as formatEtherValue } from "../../../lib/queries.js";
import "./Admin.css";

// Tiny inline sparkline renderer (no external libs)
function Sparkline({ points = [] }) {
  if (!points.length) {
    return (
      <div className="sparkline-empty">
        <div className="sparkline-placeholder">No data available</div>
      </div>
    );
  }
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
  if (!series.length) {
    return (
      <div className="chart-empty">
        <div className="chart-placeholder">No data available</div>
      </div>
    );
  }
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
    <div className="chart-container">
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
      <div className="chart-tooltip">
        <span>Latest: {series[series.length - 1]?.v?.toFixed(4) || 0} ETH</span>
      </div>
    </div>
  );
}

function BarChart({ series = [], color = "#22c55e" }) {
  if (!series.length) {
    return (
      <div className="chart-empty">
        <div className="chart-placeholder">No data available</div>
      </div>
    );
  }
  const max = Math.max(1, ...series.map((p) => p.v));
  const total = series.reduce((sum, p) => sum + p.v, 0);
  
  return (
    <div className="chart-container">
      <div className="sparkline-wrap" style={{ display: "grid", gridTemplateColumns: `repeat(${series.length || 1}, 1fr)`, alignItems: "end", gap: 6 }}>
        {series.map((p, i) => (
          <div 
            key={i} 
            title={`${p.t}: ${p.v}`} 
            style={{ 
              background: color, 
              height: `${(p.v / max) * 100}%`, 
              borderRadius: 6, 
              opacity: 0.9,
              minHeight: "4px"
            }} 
          />
        ))}
      </div>
      <div className="chart-tooltip">
        <span>
          {series.length > 5 
            ? `${series.length} items, Total: ${total}`
            : `Total: ${total}`}
        </span>
      </div>
    </div>
  );
}

function DonutChart({ data = [], colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"] }) {
  if (!data.length) {
    return (
      <div className="chart-empty">
        <div className="chart-placeholder">No data available</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="chart-empty">
        <div className="chart-placeholder">No data available</div>
      </div>
    );
  }

  // Handle single non-zero slice (SVG arcs cannot render a full 360° path)
  const nonZero = data.filter((d) => d.value > 0);
  let cumulativeAngle = 0;
  const radius = 40;
  const centerX = 50;
  const centerY = 50;

  return (
    <div className="chart-container">
      <svg className="donut-chart" viewBox="0 0 100 100" style={{ width: "100%", height: "140px" }}>
        {nonZero.length === 1 ? (
          // Draw a full ring for the single non-zero category
          <circle key="full" cx={centerX} cy={centerY} r={radius} fill={colors[ data.findIndex(d => d.value > 0) % colors.length ]} opacity={0.8} />
        ) : (
          data.map((item, index) => {
            if (!item.value) return null; // skip zero slices
          const angle = (item.value / total) * 360;
          const startAngle = cumulativeAngle;
          const endAngle = cumulativeAngle + angle;
          
          const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
          const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
          const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
          const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ');
          
          cumulativeAngle += angle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              opacity={0.8}
            />
          );
        })
        )}
        <circle
          cx={centerX}
          cy={centerY}
          r={15}
          fill="white"
        />
        <text
          x={centerX}
          y={centerY + 2}
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fill="#0f172a"
        >
          {total}
        </text>
      </svg>
      <div className="chart-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ background: colors[index % colors.length] }}
            />
            <span>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { readonlyContract } = useWeb3();

  // Basic stats query
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

  // Activity data - fetch real appointments and prescriptions for trending
  const activityQuery = useQuery({
    queryKey: ["admin", "activity"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return { appointmentTrend: [], prescriptionTrend: [] };
      
      try {
        const [appointments, prescriptions] = await Promise.all([
          fetchAllAppointments(readonlyContract),
          fetchAllPrescriptions(readonlyContract)
        ]);

        // Group appointments by day for the last 12 days
        const now = new Date();
        const days = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          days.push(date.toISOString().slice(0, 10));
        }

        const appointmentsByDay = {};
        const prescriptionsByDay = {};
        
        // Initialize all days with 0
        days.forEach(day => {
          appointmentsByDay[day] = 0;
          prescriptionsByDay[day] = 0;
        });

        // Count appointments by day
        appointments.forEach(apt => {
          const date = new Date(apt.startAt * 1000).toISOString().slice(0, 10);
          if (appointmentsByDay.hasOwnProperty(date)) {
            appointmentsByDay[date]++;
          }
        });

        // Count prescriptions by day
        prescriptions.forEach(presc => {
          const date = new Date(presc.date * 1000).toISOString().slice(0, 10);
          if (prescriptionsByDay.hasOwnProperty(date)) {
            prescriptionsByDay[date]++;
          }
        });

        const appointmentTrend = days.map(day => appointmentsByDay[day]);
        const prescriptionTrend = days.map(day => prescriptionsByDay[day]);

        return { appointmentTrend, prescriptionTrend };
      } catch (error) {
        console.error("Error fetching activity data:", error);
        return { appointmentTrend: [], prescriptionTrend: [] };
      }
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

  // Use real activity data only (no demo fallbacks)
  const activityPoints = useMemo(() => {
    if (activityQuery.data?.appointmentTrend?.length) return activityQuery.data.appointmentTrend;
    return [];
  }, [activityQuery.data]);

  // Prescription activity points (real-only)
  const prescriptionPoints = useMemo(() => {
    if (activityQuery.data?.prescriptionTrend?.length) return activityQuery.data.prescriptionTrend;
    return [];
  }, [activityQuery.data]);

  // Analytics: revenue and medicine-added series from events
  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return null;

      const toBigInt = (value) => {
        if (typeof value === "bigint") return value;
        if (!value && value !== 0) return 0n;
        if (typeof value === "number") return BigInt(Math.trunc(value));
        if (typeof value === "string") {
          try {
            return BigInt(value);
          } catch {
            return 0n;
          }
        }
        if (typeof value === "object") {
          if (typeof value.toBigInt === "function") {
            try {
              return value.toBigInt();
            } catch {
              return 0n;
            }
          }
          if ("_hex" in value && typeof value._hex === "string") {
            try {
              return BigInt(value._hex);
            } catch {
              return 0n;
            }
          }
        }
        return 0n;
      };

      const mapRevenueHistory = (history = []) => {
        if (!Array.isArray(history) || history.length === 0) return [];
        return history.map((point) => {
            const rawDay = point?.day ?? point?.[0] ?? 0;
            const dayNumber =
              typeof rawDay === "number"
                ? rawDay
                : typeof rawDay === "bigint"
                ? Number(rawDay)
                : parseInt(rawDay || "0", 10);
            const dayTs = Number.isFinite(dayNumber) ? dayNumber * 86400 : 0;
            const rawAmount = point?.amountWei ?? point?.[1] ?? 0;
            const amountWei = toBigInt(rawAmount);
            const date = new Date(dayTs * 1000);
            const label = Number.isFinite(date.getTime())
              ? date.toISOString().slice(5, 10)
              : `Day ${dayNumber}`;
            return {
              t: label,
              v: formatEtherValue(amountWei)
            };
          });
      };

      try {
        if (
          typeof readonlyContract.totalRevenueWei === "function" &&
          typeof readonlyContract.getRevenueHistory === "function"
        ) {
          const [totalRevenueWeiRaw, revenueHistory] = await Promise.all([
            readonlyContract.totalRevenueWei().catch(() => 0n),
            readonlyContract.getRevenueHistory(30).catch(() => [])
          ]);

          const totalRevenueWei = toBigInt(totalRevenueWeiRaw);
          const revenueSeries = mapRevenueHistory(revenueHistory);

          if (revenueSeries.length || totalRevenueWei > 0n) {
            return {
              totalRevenueEth: formatEtherValue(totalRevenueWei),
              revenueSeries,
              addedSeries: [],
              medicineAdded: 0,
              purchases: 0
            };
          }
        }
      } catch (contractError) {
        console.warn("Revenue history contract call failed, falling back to events", contractError);
      }

      try {
        const currentBlock = await readonlyContract.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000);

        const boughtFilter = readonlyContract.filters.MedicineBought?.();
        const addedFilter = readonlyContract.filters.MedicineAdded?.();
        const apptBookedFilter = readonlyContract.filters.AppointmentBooked?.();
        const docRegFilter = readonlyContract.filters.DoctorRegistered?.();
        const patRegFilter = readonlyContract.filters.PatientRegistered?.();

        const [bought, added, apptBooked, docRegs, patRegs] = await Promise.all([
          readonlyContract.queryFilter(boughtFilter, fromBlock).catch(() => []),
          readonlyContract.queryFilter(addedFilter, fromBlock).catch(() => []),
          readonlyContract.queryFilter(apptBookedFilter, fromBlock).catch(() => []),
          readonlyContract.queryFilter(docRegFilter, fromBlock).catch(() => []),
          readonlyContract.queryFilter(patRegFilter, fromBlock).catch(() => []),
        ]);

        let revenueWei = 0n;
        const byDay = new Map();

        for (const log of bought) {
          try {
            const block = await log.getBlock();
            const args = log.args || [];
            const paid = args?.paidWei ?? args?.[3] ?? 0n;
            const paidWei = toBigInt(paid);
            const ts = block?.timestamp ?? Math.floor(Date.now() / 1000);
            const day = new Date(ts * 1000).toISOString().slice(0, 10);
            revenueWei += paidWei;
            byDay.set(day, (byDay.get(day) || 0n) + paidWei);
          } catch (error) {
            console.warn("Error processing revenue event:", error);
          }
        }

        for (const log of apptBooked) {
          try {
            const block = await log.getBlock();
            const txHash = log.transactionHash;
            const tx = await readonlyContract.provider.getTransaction(txHash);
            const value = toBigInt(tx?.value ?? 0n);
            const adminShare = value / 10n;
            if (adminShare > 0n) {
              const ts = block?.timestamp ?? Math.floor(Date.now() / 1000);
              const day = new Date(ts * 1000).toISOString().slice(0, 10);
              revenueWei += adminShare;
              byDay.set(day, (byDay.get(day) || 0n) + adminShare);
            }
          } catch (error) {
            console.warn("Error processing appointment revenue:", error);
          }
        }

        const regLogs = [...docRegs, ...patRegs];
        for (const log of regLogs) {
          try {
            const block = await log.getBlock();
            const txHash = log.transactionHash;
            const tx = await readonlyContract.provider.getTransaction(txHash);
            const value = toBigInt(tx?.value ?? 0n);
            if (value > 0n) {
              const ts = block?.timestamp ?? Math.floor(Date.now() / 1000);
              const day = new Date(ts * 1000).toISOString().slice(0, 10);
              revenueWei += value;
              byDay.set(day, (byDay.get(day) || 0n) + value);
            }
          } catch (error) {
            console.warn("Error processing registration revenue:", error);
          }
        }

        const addedByDay = new Map();
        for (const log of added) {
          try {
            const block = await log.getBlock();
            const ts = block?.timestamp ?? Math.floor(Date.now() / 1000);
            const day = new Date(ts * 1000).toISOString().slice(0, 10);
            addedByDay.set(day, (addedByDay.get(day) || 0) + 1);
          } catch (error) {
            console.warn("Error processing medicine added event:", error);
          }
        }

        const days = Array.from(new Set([...byDay.keys(), ...addedByDay.keys()])).sort();
        const revenueSeries = days.map((d) => ({
          t: d.slice(5),
          v: formatEtherValue(byDay.get(d) || 0n),
        }));
        const addedSeries = days.map((d) => ({
          t: d.slice(5),
          v: addedByDay.get(d) || 0,
        }));

        return {
          totalRevenueEth: formatEtherValue(revenueWei),
          revenueSeries,
          addedSeries,
          medicineAdded: added?.length || 0,
          purchases: bought?.length || 0,
        };
      } catch (error) {
        console.error("Analytics query error:", error);
        return {
          totalRevenueEth: 0,
          revenueSeries: [],
          addedSeries: [],
          medicineAdded: 0,
          purchases: 0,
        };
      }
    },
  });

  // Doctor performance data (real-only)
  const doctorStatsQuery = useQuery({
    queryKey: ["admin", "doctor-stats"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return { approvalStats: [], performanceData: [] };
      try {
        const doctors = await fetchDoctors(readonlyContract);
        const approved = doctors.filter(d => d.approved).length;
        const pending = doctors.filter(d => !d.approved).length;
        const approvalStats = [
          { label: "Approved", value: approved },
          { label: "Pending", value: pending }
        ];
        const performanceData = doctors
          .filter(d => d.approved && d.appointments > 0)
          .sort((a, b) => (b.successes / b.appointments) - (a.successes / a.appointments))
          .slice(0, 5)
          .map(d => ({
            t: d.displayName || `Dr. ${d.id}`,
            v: Math.round((d.successes / d.appointments) * 100)
          }));
        return { approvalStats, performanceData };
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        return { approvalStats: [], performanceData: [] };
      }
    }
  });

  // Medicine inventory stats (real-only)
  const medicineStatsQuery = useQuery({
    queryKey: ["admin", "medicine-stats"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return { inventoryStats: [], stockLevels: [] };
      try {
        const medicines = await fetchMedicines(readonlyContract);
        const active = medicines.filter(m => m.active).length;
        const inactive = medicines.filter(m => !m.active).length;
        const outOfStock = medicines.filter(m => m.active && m.stock === 0).length;
        const lowStock = medicines.filter(m => m.active && m.stock > 0 && m.stock < 10).length;
        const inventoryStats = [
          { label: "Active", value: active },
          { label: "Inactive", value: inactive },
          { label: "Out of Stock", value: outOfStock },
          { label: "Low Stock", value: lowStock }
        ];
        const stockLevels = medicines
          .filter(m => m.active)
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 8)
          .map(m => ({
            t: (m.displayName || `Med ${m.id}`).slice(0, 8),
            v: m.stock
          }));
        return { inventoryStats, stockLevels };
      } catch (error) {
        console.error("Error fetching medicine stats:", error);
        return { inventoryStats: [], stockLevels: [] };
      }
    }
  });

  return (
    <section className="page admin-dashboard">
      <div className="dash-hero">
        <div className="dash-hero-content">
          <h2>
            Admin Dashboard
            <span className="dash-gradient-text"> • MediFuse</span>
            {readonlyContract && (
              <span className="status-indicator live">
                <span className="status-dot"></span>
                Live
              </span>
            )}
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

      {/* Total Revenue summary styled like KPI card, with a full-width chart below */}
      <div className="revenue-block">
        <div className="kpi-card revenue-summary">
          <div className="kpi-icon" aria-hidden>💰</div>
          <div className="kpi-meta center">
            <span className="stat-label">Total Revenue (ETH)</span>
            <strong className="stat-value revenue-amount">
              {analyticsQuery.isLoading
                ? "…"
                : (analyticsQuery.data?.totalRevenueEth?.toFixed?.(4) ?? "0.0000")}
            </strong>
          </div>
        </div>
        <div className="panel fancy-panel revenue-chart-panel">
          {analyticsQuery.isLoading ? (
            <div className="skeleton-card" />
          ) : (
            <AreaChart series={analyticsQuery.data?.revenueSeries || []} color="#1e88e5" />
          )}
        </div>
      </div>

      

      <div className="card-grid">
        {/* System Activity moved here to align in one row with the other two panels */}
        <div className="panel fancy-panel">
          <h3>System Activity</h3>
          <div className="activity-metrics">
            <div className="activity-grid">
              <div className="activity-item">
                <span className="activity-label">Appointments</span>
                <div className="activity-chart">
                  {activityQuery.isLoading ? (
                    <div className="skeleton-mini" />
                  ) : (
                    <Sparkline points={activityPoints} />
                  )}
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-label">Prescriptions</span>
                <div className="activity-chart">
                  {activityQuery.isLoading ? (
                    <div className="skeleton-mini" />
                  ) : (
                    <Sparkline points={prescriptionPoints} />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="panel-footer-text">
            {activityQuery.data?.appointmentTrend?.length 
              ? "Real-time system activity over last 12 days"
              : "No on‑chain activity data available"}
          </div>
        </div>

        <div className="panel fancy-panel">
          <h3>Medicine Inventory</h3>
          {medicineStatsQuery.isLoading ? (
            <div className="skeleton-card" />
          ) : (
            <DonutChart 
              data={medicineStatsQuery.data?.inventoryStats || []} 
              colors={["#22c55e", "#6b7280", "#ef4444", "#f59e0b"]}
            />
          )}
          
        </div>

        <div className="panel fancy-panel">
          <h3>Doctor Performance</h3>
          {doctorStatsQuery.isLoading ? (
            <div className="skeleton-card" />
          ) : (
            <BarChart 
              series={doctorStatsQuery.data?.performanceData || []} 
              color="#8b5cf6" 
            />
          )}
          <div className="panel-footer-text">Success rate (%) for top performing doctors</div>
        </div>
      </div>
    </section>
  );
}
