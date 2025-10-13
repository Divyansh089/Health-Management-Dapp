import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import PatientProfileModal from "../../../components/Modals/PatientProfileModal.jsx";
import "./Admin.css";

export default function AdminPatients() {
  const { readonlyContract } = useWeb3();
  const [selectedPatient, setSelectedPatient] = useState(null);

  const patientsQuery = useQuery({
    queryKey: ["admin", "patients", readonlyContract?.target],
    enabled: !!readonlyContract,
    queryFn: async () => {
      if (!readonlyContract) return [];
      const count = Number(await readonlyContract.patientCount());
      const list = [];
      for (let i = 1; i <= count; i += 1) {
        const row = await readonlyContract.patients(i);
        list.push({
          id: Number(row.id),
          account: row.account,
          ipfs: row.ipfs
        });
      }
      return list;
    }
  });

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
        {(patientsQuery.data || []).map((patient) => (
          <article key={patient.id} className="panel">
            <h3>Patient #{patient.id}</h3>
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
