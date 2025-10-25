
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DoctorStrip from "../../../components/Cards/DoctorStrip.jsx";
import DoctorProfileModal from "../../../components/Modals/DoctorProfileModal.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { fetchDoctors } from "../../../lib/queries.js";
import "./Public.css";

export default function BrowseDoctors() {
  const { readonlyContract } = useWeb3();
  const [selectedDoctor, setSelectedDoctor] = useState(null);

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

  <div>
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
          <DoctorStrip key={doctor.id} doctor={doctor} onView={setSelectedDoctor} />
        ))}
      </div>

      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={Boolean(selectedDoctor)}
        onClose={() => setSelectedDoctor(null)}
      />
    </section>
  );
}
