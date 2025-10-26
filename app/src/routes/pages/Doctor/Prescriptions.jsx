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
  fetchChatsByDoctor,
  fetchMedicines,
  fetchPatients
} from "../../../lib/queries.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import "./Doctor.css";

export default function DoctorPrescriptions() {
  const queryClient = useQueryClient();
  const { role, doctorId, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");

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

  const chatsQuery = useQuery({
    queryKey: ["doctor", "chats", doctorId, "for-prescriptions"],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: () => fetchChatsByDoctor(readonlyContract, doctorId)
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
    mutationFn: async ({ patientId, medicineId, durationDays, notes, chatId }) => {
      if (!signerContract) throw new Error("Connect your wallet as an approved doctor.");
      if (durationDays < 3) {
        throw new Error("Prescription duration must be at least 3 days.");
      }

      let notesCid = "";
      if (notes?.trim()) {
        const payload = {
          type: "medifuse.prescription/notes",
          version: 1,
          doctorId,
          patientId: Number(patientId),
          chatId: Number(chatId),
          createdAt: new Date().toISOString(),
          notes: notes.trim()
        };
        const upload = await uploadJSONToIPFS(payload);
        notesCid = upload.ipfsUrl || upload.cid || "";
      }

      const tx = await signerContract.prescribe(
        Number(patientId),
        Number(medicineId),
        Number(durationDays),
        notesCid,
        Number(chatId)
      );
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
        const labelName = name && name.length ? name : patient?.humanId || formatEntityId("PAT", patientId);
        const accountSlice = patient?.account ? `${patient.account.slice(0, 6)}…${patient.account.slice(-4)}` : "";
        return {
          value: patientId,
          label: accountSlice ? `${labelName} (${accountSlice})` : labelName
        };
      });
  }, [appointmentsQuery.data, patientsQuery.data]);

  const medicineOptions = useMemo(() => {
    return (medicinesQuery.data || []).map((medicine) => {
      const name = medicine.displayName?.trim?.();
      const labelName = name && name.length ? name : medicine.humanId || formatEntityId("MED", medicine.id);
      return {
        value: medicine.id,
        label: `${labelName} – ${medicine.priceEth.toFixed(4)} ETH`
      };
    });
  }, [medicinesQuery.data]);

  const chatOptions = useMemo(() => {
    if (!selectedPatientId) return [];
    return (chatsQuery.data || [])
      .filter((chat) => chat.patientId === Number(selectedPatientId) && chat.closed)
      .map((chat) => ({
        value: chat.id,
        label: `Chat ${formatEntityId("CHAT", chat.id)} · Closed ${formatDate(chat.lastMessageAt)}`
      }));
  }, [chatsQuery.data, selectedPatientId]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Prescriptions</h2>
          <p>Create new prescriptions after completing the consultation chat and review your history.</p>
        </div>
      </header>

      <section className="panel">
        <h3>New Prescription</h3>
        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const patientId = form.get("patientId");
            const medicineId = form.get("medicineId");
            const durationDays = Number(form.get("durationDays") || 0);
            const chatId = form.get("chatId");
            const notes = form.get("notes")?.toString() || "";

            const chatRecord = (chatsQuery.data || []).find((chat) => chat.id === Number(chatId));
            if (!chatRecord || !chatRecord.closed) {
              setToast({ type: "error", message: "Select a closed chat session before prescribing." });
              return;
            }
            if (chatRecord.patientId !== Number(patientId)) {
              setToast({ type: "error", message: "Selected chat does not match the patient." });
              return;
            }

            prescribeMutation.mutate({ patientId, medicineId, durationDays, notes, chatId });
            event.currentTarget.reset();
            setSelectedPatientId("");
            setSelectedChatId("");
          }}
        >
          <SelectField
            name="patientId"
            label="Patient"
            options={patientOptions}
            required
            placeholder={patientOptions.length ? "Select patient" : "No patients assigned"}
            helper="Patients with scheduled appointments"
            onChange={(event) => {
              setSelectedPatientId(event.target.value);
              setSelectedChatId("");
            }}
          />
          <SelectField
            name="medicineId"
            label="Medicine"
            options={medicineOptions}
            required
            placeholder={medicineOptions.length ? "Select medicine" : "No active medicines"}
          />
          <SelectField
            name="chatId"
            label="Chat Session"
            options={chatOptions}
            required
            value={selectedChatId}
            onChange={(event) => setSelectedChatId(event.target.value)}
            placeholder={selectedPatientId ? (chatOptions.length ? "Select closed chat" : "No closed chats") : "Select patient first"}
            helper="Chat must be closed before prescribing"
          />
          <InputField
            name="durationDays"
            label="Duration (days)"
            type="number"
            min={3}
            defaultValue={3}
            required
            helper="Minimum 3 days"
          />
          <label className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span className="form-label">Prescription Notes (IPFS)</span>
            <textarea
              name="notes"
              className="form-input"
              rows={3}
              placeholder="Summarise dosage or special instructions (optional)"
            />
            <span className="form-helper">Notes are pinned to IPFS for auditability.</span>
          </label>
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
                    <span className="table-sub">Duration: {item.durationDays} days</span>
                    {item.chatId ? (
                      <span className="table-sub">Chat: {formatEntityId("CHAT", item.chatId)}</span>
                    ) : null}
                  </div>
                  {item.notesCid && (
                    <div>
                      <span className="table-sub">Notes CID: {item.notesCid}</span>
                    </div>
                  )}
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
