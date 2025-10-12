import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import "./Admin.css";

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
      { label: "Doctors", value: statsQuery.data?.doctorCount ?? 0 },
      { label: "Patients", value: statsQuery.data?.patientCount ?? 0 },
      { label: "Medicines", value: statsQuery.data?.medicineCount ?? 0 },
      { label: "Appointments", value: statsQuery.data?.appointmentCount ?? 0 },
      { label: "Prescriptions", value: statsQuery.data?.prescriptionCount ?? 0 }
    ],
    [statsQuery.data]
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>High-level view of MediFuse activity across the network.</p>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-label">{stat.label}</span>
            <strong className="stat-value">
              {statsQuery.isLoading ? "..." : stat.value.toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
