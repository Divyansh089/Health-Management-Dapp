import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchAppointmentsByDoctor, fetchPatients } from "../../../lib/queries.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import "./Doctor.css";

export default function DoctorAppointments() {
  const { role, doctorId, readonlyContract } = useWeb3();
  const isDoctor = role === ROLES.DOCTOR;

  const appointmentsQuery = useQuery({
    queryKey: ["doctor", "appointments", doctorId, "patients"],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: () => fetchAppointmentsByDoctor(readonlyContract, doctorId)
  });

  const patientsQuery = useQuery({
    queryKey: ["doctor", "patients-all"],
    enabled: isDoctor && !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  if (!isDoctor) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Patient Activity</h2>
          <p>You must connect with a registered doctor wallet.</p>
        </div>
      </section>
    );
  }

  const patients = useMemo(() => {
    const map = {};
    (patientsQuery.data || []).forEach((patient) => {
      const name = patient.displayName?.trim?.();
      const label = name && name.length ? name : patient.humanId || formatEntityId("PAT", patient.id);
      map[patient.id] = {
        ...patient,
        humanId: label
      };
    });
    return map;
  }, [patientsQuery.data]);

  const grouped = useMemo(() => {
    const byPatient = {};
    (appointmentsQuery.data || []).forEach((appointment) => {
      const key = appointment.patientId;
      if (!byPatient[key]) {
        byPatient[key] = [];
      }
      byPatient[key].push(appointment);
    });
    return Object.entries(byPatient).sort(([a], [b]) => Number(a) - Number(b));
  }, [appointmentsQuery.data]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Assigned Patients</h2>
          <p>Track upcoming and completed appointments for each patient.</p>
        </div>
      </header>

      {grouped.length === 0 ? (
        <div className="panel">
          <p>You have no patients scheduled.</p>
        </div>
      ) : (
        <div className="patient-grid">
          {grouped.map(([patientId, appointments]) => {
            const patient = patients[patientId];
            return (
              <article key={patientId} className="panel">
                <h3>
                  {patient?.humanId || formatEntityId("PAT", Number(patientId))}
                  <span className="patient-account">{patient?.account}</span>
                </h3>
                <ul className="appointment-list">
                  {appointments
                    .sort((a, b) => b.startAt - a.startAt)
                    .map((appointment) => (
                      <li key={appointment.id} className="appointment-row">
                        <div>
                          <strong>#{appointment.id}</strong>
                          <span>{formatDate(appointment.startAt)}</span>
                        </div>
                        <span className={`status-chip ${appointment.open ? "status-success" : "status-muted"}`}>
                          {appointment.open ? "Upcoming" : "Completed"}
                        </span>
                      </li>
                    ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
