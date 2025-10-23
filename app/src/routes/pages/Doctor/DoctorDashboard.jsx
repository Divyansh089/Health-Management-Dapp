import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppointmentTable from "../../../components/Tables/AppointmentTable.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchAppointmentsByDoctor, fetchPatients } from "../../../lib/queries.js";
import { formatEntityId } from "../../../lib/format.js";
import "./Doctor.css";

export default function DoctorDashboard() {
  const queryClient = useQueryClient();
  const { role, doctorId, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);

  const isDoctor = role === ROLES.DOCTOR;

  const doctorQuery = useQuery({
    queryKey: ["doctor", "self", doctorId],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: async () => {
      const row = await readonlyContract.doctors(doctorId);
      
      // Fetch IPFS profile data to get the doctor's name
      let displayName = null;
      if (row.ipfs) {
        try {
          const ipfsUrl = row.ipfs.startsWith("http") 
            ? row.ipfs 
            : `https://ipfs.io/ipfs/${row.ipfs.replace("ipfs://", "")}`;
          const response = await fetch(ipfsUrl);
          if (response.ok) {
            const profile = await response.json();
            displayName = profile?.name || profile?.fullName || null;
          }
        } catch (error) {
          console.error("Error fetching doctor profile:", error);
        }
      }
      
      return {
        id: Number(row.id),
        humanId: formatEntityId("DOC", Number(row.id)),
        account: row.account,
        ipfs: row.ipfs,
        appointments: Number(row.appointments),
        successes: Number(row.successes),
        approved: row.approved,
        displayName: displayName
      };
    }
  });

  const appointmentsQuery = useQuery({
    queryKey: ["doctor", "appointments", doctorId],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: () => fetchAppointmentsByDoctor(readonlyContract, doctorId)
  });

  const patientLookupQuery = useQuery({
    queryKey: ["doctor", "patients", doctorId],
    enabled: isDoctor && !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  const completeAppointment = useMutation({
    mutationFn: async (appointmentId) => {
      if (!signerContract) throw new Error("Connect your wallet as an approved doctor.");
      const tx = await signerContract.completeAppointment(appointmentId);
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "self", doctorId] });
      setToast({ type: "success", message: "Appointment marked as completed." });
    },
    onError: (error) =>
      setToast({ type: "error", message: error.message || "Failed to complete appointment." })
  });

  const patientLookup = useMemo(() => {
    const map = {};
    (patientLookupQuery.data || []).forEach((patient) => {
      map[patient.id] = {
        account: patient.account,
        name: patient.humanId || formatEntityId("PAT", patient.id)
      };
    });
    return map;
  }, [patientLookupQuery.data]);

  if (!isDoctor) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Access Restricted</h2>
          <p>You must connect with a registered doctor wallet.</p>
        </div>
      </section>
    );
  }

  const doctor = doctorQuery.data;
  const appointments = appointmentsQuery.data || [];

  const successRate =
    doctor && doctor.appointments > 0
      ? Math.round((doctor.successes / doctor.appointments) * 100)
      : null;

  const doctorLookup = doctor
    ? {
        [doctor.id]: {
          account: doctor.account,
          name: doctor.humanId || formatEntityId("DOC", doctor.id)
        }
      }
    : {};

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>
            {doctorQuery.isLoading 
              ? "Welcome, Doctor!" 
              : doctor?.displayName 
                ? `Welcome, Dr. ${doctor.displayName}!` 
                : `Welcome, ${doctor?.humanId || 'Doctor'}!`
            }
          </h2>
          <p>Manage your appointments and track your performance.</p>
        </div>
      </header>

      <section className="panel">
        <h3>Profile</h3>
        {doctorQuery.isLoading ? (
          <p>Loading profile...</p>
        ) : doctor ? (
          <div className="doctor-grid">
            <div className="doctor-tile">
              <span className="tile-label">Doctor ID</span>
              <strong className="tile-value">{doctor.humanId || formatEntityId("DOC", doctor.id)}</strong>
            </div>
            <div className="doctor-tile">
              <span className="tile-label">Wallet</span>
              <strong className="tile-value mono">{doctor.account}</strong>
            </div>
            <div className="doctor-tile">
              <span className="tile-label">Appointments</span>
              <strong className="tile-value">{doctor.appointments}</strong>
            </div>
            <div className="doctor-tile">
              <span className="tile-label">Completed</span>
              <strong className="tile-value">{doctor.successes}</strong>
            </div>
            <div className="doctor-tile">
              <span className="tile-label">Success Rate</span>
              <strong className="tile-value">
                {successRate !== null ? `${successRate}%` : "No data"}
              </strong>
            </div>
            <div className="doctor-tile">
              <span className="tile-label">Status</span>
              <strong className="tile-value">{doctor.approved ? "Approved" : "Pending"}</strong>
            </div>
          </div>
        ) : (
          <p>No doctor profile found for this wallet.</p>
        )}
      </section>

      <section className="panel">
        <h3>Appointments</h3>
        {appointmentsQuery.isError && (
          <p className="error-text">Unable to load appointments. Refresh and try again.</p>
        )}
        <AppointmentTable
          appointments={appointments}
          doctorLookup={doctorLookup}
          patientLookup={patientLookup}
          onAction={(appointment) => completeAppointment.mutate(appointment.id)}
          actionLabel="Mark Complete"
          actionDisabledIds={new Set(appointments.filter((a) => !a.open).map((a) => a.id))}
          emptyLabel="You have no scheduled appointments."
        />
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          duration={4000}
        />
      )}
    </section>
  );
}
