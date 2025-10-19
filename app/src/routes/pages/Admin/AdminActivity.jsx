import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppointmentTable from "../../../components/Tables/AppointmentTable.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import {
  fetchAllAppointments,
  fetchAllPrescriptions,
  fetchDoctors,
  fetchMedicines,
  fetchPatients
} from "../../../lib/queries.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import "./Admin.css";

export default function AdminActivity() {
  const { role, readonlyContract } = useWeb3();
  const isAdmin = role === ROLES.ADMIN;

  const doctorsQuery = useQuery({
    queryKey: ["admin", "doctors", "activity"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchDoctors(readonlyContract)
  });

  const patientsQuery = useQuery({
    queryKey: ["admin", "patients", "activity"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  const appointmentsQuery = useQuery({
    queryKey: ["admin", "appointments"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchAllAppointments(readonlyContract)
  });

  const prescriptionsQuery = useQuery({
    queryKey: ["admin", "prescriptions"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchAllPrescriptions(readonlyContract)
  });

  const medicinesQuery = useQuery({
    queryKey: ["admin", "medicines", "activity"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchMedicines(readonlyContract, { includeInactive: true })
  });

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Network Activity</h2>
          <p>Access denied. Connect with the admin wallet.</p>
        </div>
      </section>
    );
  }

  const doctorLookup = useMemo(() => {
    const map = {};
    (doctorsQuery.data || []).forEach((doc) => {
      const label = doc.humanId || formatEntityId("DOC", doc.id);
      map[doc.id] = {
        account: doc.account,
        name: label,
        humanId: label
      };
    });
    return map;
  }, [doctorsQuery.data]);

  const patientLookup = useMemo(() => {
    const map = {};
    (patientsQuery.data || []).forEach((row) => {
      const label = row.humanId || formatEntityId("PAT", row.id);
      map[row.id] = {
        account: row.account,
        name: label,
        humanId: label
      };
    });
    return map;
  }, [patientsQuery.data]);

  const medicineLookup = useMemo(() => {
    const map = {};
    (medicinesQuery.data || []).forEach((row) => {
      const label = row.humanId || formatEntityId("MED", row.id);
      map[row.id] = {
        ...row,
        humanId: label
      };
    });
    return map;
  }, [medicinesQuery.data]);

  const prescriptions = useMemo(() => {
    const list = prescriptionsQuery.data || [];
    return list
      .map((item) => ({
        ...item,
        doctor: doctorLookup[item.doctorId],
        patient: patientLookup[item.patientId],
        medicine: medicineLookup[item.medicineId]
      }))
      .sort((a, b) => b.date - a.date);
  }, [prescriptionsQuery.data, doctorLookup, patientLookup, medicineLookup]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Network Activity</h2>
          <p>Monitor appointments and prescriptions across the platform.</p>
        </div>
      </header>

      <section className="panel">
        <h3>Appointments</h3>
        <AppointmentTable
          appointments={appointmentsQuery.data || []}
          doctorLookup={doctorLookup}
          patientLookup={patientLookup}
          emptyLabel="No appointments have been recorded yet."
        />
      </section>

      <section className="panel">
        <h3>Prescriptions</h3>
        {prescriptions.length === 0 ? (
          <p>No prescriptions have been created yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medicine</th>
                  <th>Doctor</th>
                  <th>Patient</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>
                      <span className="table-strong">
                        {item.medicine
                          ? item.medicine.humanId || formatEntityId("MED", item.medicine.id)
                          : "Unknown"}
                      </span>
                      <span className="table-sub">{item.medicine?.ipfs}</span>
                    </td>
                    <td>
                      <span className="table-strong">
                        {item.doctor?.name || formatEntityId("DOC", item.doctorId)}
                      </span>
                      <span className="table-sub">{item.doctor?.account}</span>
                    </td>
                    <td>
                      <span className="table-strong">
                        {item.patient?.name || formatEntityId("PAT", item.patientId)}
                      </span>
                      <span className="table-sub">{item.patient?.account}</span>
                    </td>
                    <td>{formatDate(item.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
