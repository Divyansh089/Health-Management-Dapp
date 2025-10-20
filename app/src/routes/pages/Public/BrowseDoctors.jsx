
import { useQuery } from "@tanstack/react-query";
import DoctorCard from "../../../components/Cards/DoctorCard.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { fetchDoctors } from "../../../lib/queries.js";
import "./Public.css";

export default function BrowseDoctors() {
  const { readonlyContract } = useWeb3();

  const doctorsQuery = useQuery({
    queryKey: ["public", "doctors"],
    enabled: !!readonlyContract,
    queryFn: () => fetchDoctors(readonlyContract)
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Browse Doctors</h2>
          <p>Every registered doctor. Approved profiles can prescribe and manage appointments.</p>
        </div>
      </header>

      <div className="card-grid">
        {doctorsQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="panel skeleton-card" />
          ))}
        {!doctorsQuery.isLoading && (doctorsQuery.data || []).length === 0 && (
          <div className="panel">
            <p>No doctors registered yet.</p>
          </div>
        )}
        {(doctorsQuery.data || []).map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </section>
  );
}
