import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import PatientProfileModal from "../../../components/Modals/PatientProfileModal.jsx";
import { fetchPatients } from "../../../lib/queries.js";
import { formatEntityId } from "../../../lib/format.js";
import { useSearch } from "../../../state/SearchContext.jsx";
import "./Admin.css";

export default function AdminPatients() {
  const { readonlyContract } = useWeb3();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { query, setPlaceholder, clearQuery } = useSearch();

  useEffect(() => {
    setPlaceholder("Search patients by ID or wallet");
    return () => {
      setPlaceholder();
      clearQuery();
    };
  }, [setPlaceholder, clearQuery]);

  const patientsQuery = useQuery({
    queryKey: ["admin", "patients", readonlyContract?.target],
    enabled: !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  const patients = patientsQuery.data || [];

  const filteredPatients = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => {
      const values = [patient.humanId, patient.account, patient.ipfs, String(patient.id)]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return values.some((value) => value.includes(term));
    });
  }, [patients, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Registered Patients</h2>
          <p>Review onboarded patients and their on-chain identifiers.</p>
        </div>
        <div className="page-actions">
          <a href="/onboard/patient" className="btn-add">
            ➕ Add Patient
          </a>
        </div>
      </header>
      <div className="card-grid">
        {patientsQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="panel skeleton-card" />
          ))}
        {patientsQuery.isError && (
          <div className="panel">
            <p className="error-text">Unable to load patient registry.</p>
          </div>
        )}
        {!patientsQuery.isLoading && filteredPatients.length === 0 && (
          <div className="panel">
            <p>{hasQuery ? "No patients match your search." : "No patients registered yet."}</p>
          </div>
        )}
        {filteredPatients.map((patient) => (
          <article key={patient.id} className="panel">
            <h3>{patient.humanId || formatEntityId("PAT", patient.id)}</h3>
            <p>
              <strong>Wallet:</strong> {patient.account}
            </p>
            <p>
              <strong>Profile:</strong> {" "}
              {patient.ipfs ? (
                <button 
                  onClick={() => setSelectedPatient(patient)}
                  className="view-profile-btn"
                >
                  View Profile
                </button>
              ) : (
                "Not provided"
              )}
            </p>
          </article>
        ))}
      </div>

      <PatientProfileModal 
        patient={selectedPatient}
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </section>
  );
}
