
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import {
  fetchAllPrescriptions,
  fetchAppointmentsByDoctor,
  fetchMedicines,
  fetchPatients
} from "../../../lib/queries.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import "./Doctor.css";

export default function DoctorPrescriptions() {
  const queryClient = useQueryClient();
  const { role, doctorId, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);

  const isDoctor = role === ROLES.DOCTOR;

  const appointmentsQuery = useQuery({
    queryKey: ["doctor", "appointments", doctorId, "for-prescriptions"],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: () => fetchAppointmentsByDoctor(readonlyContract, doctorId)
  });

  const patientsQuery = useQuery({
    queryKey: ["doctor", "patients-for-prescriptions"],
    enabled: isDoctor && !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  const medicinesQuery = useQuery({
    queryKey: ["doctor", "medicines"],
    enabled: isDoctor && !!readonlyContract,
    queryFn: () => fetchMedicines(readonlyContract, { includeInactive: false })
  });

  const prescriptionsQuery = useQuery({
    queryKey: ["doctor", "prescriptions", doctorId],
    enabled: isDoctor && !!readonlyContract,
    queryFn: async () => {
      const all = await fetchAllPrescriptions(readonlyContract);
      return all.filter((item) => item.doctorId === doctorId).sort((a, b) => b.date - a.date);
    }
  });

  const prescribeMutation = useMutation({
    mutationFn: async ({ patientId, medicineId }) => {
      if (!signerContract) throw new Error("Connect your wallet as an approved doctor.");
      const tx = await signerContract.prescribe(Number(patientId), Number(medicineId));
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "prescriptions", doctorId] });
      setToast({ type: "success", message: "Prescription recorded successfully." });
    },
    onError: (error) =>
      setToast({ type: "error", message: error.message || "Failed to create prescription." })
  });

  if (!isDoctor) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Prescriptions</h2>
          <p>You must connect with a registered doctor wallet.</p>
        </div>
      </section>
    );
  }

  const patientOptions = useMemo(() => {
    const seen = new Set();
    return (appointmentsQuery.data || [])
      .map((appointment) => appointment.patientId)
      .filter((patientId) => {
        if (seen.has(patientId)) return false;
        seen.add(patientId);
        return true;
      })
      .map((patientId) => {
        const patient = (patientsQuery.data || []).find((p) => p.id === patientId);
        const name = patient?.displayName?.trim?.();
        const labelName = name && name.length
          ? name
          : patient?.humanId || formatEntityId("PAT", patientId);
        return {
          value: patientId,
          label: patient
            ? `${labelName} (${patient.account.slice(0, 6)}…)`
            : `${labelName}`
        };
      });
  }, [appointmentsQuery.data, patientsQuery.data]);

  const medicineOptions = useMemo(() => {
    return (medicinesQuery.data || []).map((medicine) => {
      const name = medicine.displayName?.trim?.();
      const labelName = name && name.length
        ? name
        : medicine.humanId || formatEntityId("MED", medicine.id);
      return {
        value: medicine.id,
        label: `${labelName} — ${medicine.priceEth.toFixed(4)} ETH`
      };
    });
  }, [medicinesQuery.data]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Prescriptions</h2>
          <p>Create new prescriptions and review your history.</p>
        </div>
      </header>

      <section className="panel">
        <h3>New Prescription</h3>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            prescribeMutation.mutate({
              patientId: form.get("patientId"),
              medicineId: form.get("medicineId")
            });
            event.currentTarget.reset();
          }}
        >
          <SelectField
            name="patientId"
            label="Patient"
            options={patientOptions}
            required
            placeholder={patientOptions.length ? "Select patient" : "No patients assigned"}
            helper="Patients with scheduled appointments"
          />
          <SelectField
            name="medicineId"
            label="Medicine"
            options={medicineOptions}
            required
            placeholder={medicineOptions.length ? "Select medicine" : "No active medicines"}
          />
          <button type="submit" className="primary-btn" disabled={prescribeMutation.isPending}>
            {prescribeMutation.isPending ? "Submitting…" : "Prescribe"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>History</h3>
        {prescriptionsQuery.isLoading ? (
          <p>Loading…</p>
        ) : prescriptionsQuery.data?.length ? (
          <ul className="prescription-list">
            {prescriptionsQuery.data.map((item) => {
              const medicine = medicinesQuery.data?.find((m) => m.id === item.medicineId);
              const patientRecord = patientsQuery.data?.find((p) => p.id === item.patientId);
              const patientDisplay = patientRecord?.displayName?.trim?.();
              const patientName = patientDisplay && patientDisplay.length
                ? patientDisplay
                : patientRecord?.humanId || formatEntityId("PAT", item.patientId);
              const patientLabel = patientRecord?.account || "Unknown";
              const medicineDisplay = medicine?.displayName?.trim?.();
              const medicineName = medicineDisplay && medicineDisplay.length
                ? medicineDisplay
                : medicine?.humanId || formatEntityId("MED", item.medicineId);
              return (
                <li key={item.id} className="prescription-row">
                  <div>
                    <strong>#{item.id}</strong>
                    <span className="table-sub">{formatDate(item.date)}</span>
                  </div>
                  <div>
                    <span className="table-strong">{patientName}</span>
                    <span className="table-sub">{patientLabel}</span>
                  </div>
                  <div>
                    <span className="table-strong">
                      {medicineName} {medicine ? `(${medicine.priceEth.toFixed(4)} ETH)` : ""}
                    </span>
                    <span className="table-sub">{medicine?.ipfs}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No prescriptions yet.</p>
        )}
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
