import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppointmentTable from "../../../components/Tables/AppointmentTable.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchAppointmentsByPatient, fetchDoctors } from "../../../lib/queries.js";
import "./Patient.css";

export default function PatientDashboard() {
  const { role, patientId, readonlyContract } = useWeb3();
  const isPatient = role === ROLES.PATIENT;

  const patientQuery = useQuery({
    queryKey: ["patient", "profile", patientId],
    enabled: isPatient && !!readonlyContract && !!patientId,
    queryFn: async () => {
      const row = await readonlyContract.patients(patientId);
      return {
        id: Number(row.id),
        account: row.account,
        ipfs: row.ipfs
      };
    }
  });

  const appointmentsQuery = useQuery({
    queryKey: ["patient", "appointments", patientId],
    enabled: isPatient && !!readonlyContract && !!patientId,
    queryFn: () => fetchAppointmentsByPatient(readonlyContract, patientId)
  });

  const doctorsQuery = useQuery({
    queryKey: ["patient", "doctors"],
    enabled: isPatient && !!readonlyContract,
    queryFn: () => fetchDoctors(readonlyContract, { onlyApproved: true })
  });

  if (!isPatient) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Patient Dashboard</h2>
          <p>Connect with a registered patient wallet to access this page.</p>
        </div>
      </section>
    );
  }

  const doctorLookup = useMemo(() => {
    const map = {};
    (doctorsQuery.data || []).forEach((doctor) => {
      map[doctor.id] = { account: doctor.account, name: `Dr. #${doctor.id}` };
    });
    return map;
  }, [doctorsQuery.data]);

  const patient = patientQuery.data;
  const appointments = appointmentsQuery.data || [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Patient Dashboard</h2>
          <p>Review your profile and upcoming appointments.</p>
        </div>
      </header>

      <section className="panel">
        <h3>Profile</h3>
        {patientQuery.isError && (
          <p className="error-text">Unable to load your on-chain profile. Try reconnecting.</p>
        )}
        {patientQuery.isLoading ? (
          <p>Loading profile...</p>
        ) : patient ? (
          <div className="patient-grid">
            <div className="patient-tile">
              <span className="tile-label">Patient ID</span>
              <strong className="tile-value">#{patient.id}</strong>
            </div>
            <div className="patient-tile">
              <span className="tile-label">Wallet</span>
              <strong className="tile-value mono">{patient.account}</strong>
            </div>
            <div className="patient-tile">
              <span className="tile-label">Profile</span>
              {patient.ipfs ? (
                <a href={patient.ipfs} target="_blank" rel="noreferrer">
                  View record
                </a>
              ) : (
                <span className="tile-sub">Not provided</span>
              )}
            </div>
          </div>
        ) : (
          <p>No profile found for this wallet.</p>
        )}
      </section>

      <section className="panel">
        <h3>Appointments</h3>
        {appointmentsQuery.isError && (
          <p className="error-text">Unable to fetch appointments. Please refresh and try again.</p>
        )}
        <AppointmentTable
          appointments={appointments}
          doctorLookup={doctorLookup}
          patientLookup={patient ? { [patient.id]: patient } : {}}
          emptyLabel="No appointments booked yet."
          actionLabel=""
        />
      </section>
    </section>
  );
}

