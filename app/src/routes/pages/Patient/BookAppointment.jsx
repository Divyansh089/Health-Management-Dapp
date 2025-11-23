
import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import SelectField from "../../../components/Forms/SelectField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import WarningModal from "../../../components/Modals/WarningModal.jsx";
import DoctorStrip from "../../../components/Cards/DoctorStrip.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchDoctors } from "../../../lib/queries.js";
import { formatEntityId } from "../../../lib/format.js";
import "./Patient.css";

export default function BookAppointment() {
  const queryClient = useQueryClient();
  const { role, patientId, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [warning, setWarning] = useState(null);

  const isPatient = role === ROLES.PATIENT;

  const doctorsQuery = useQuery({
    queryKey: ["book", "doctors"],
    enabled: isPatient && !!readonlyContract,
    queryFn: () => fetchDoctors(readonlyContract, { onlyApproved: true })
  });

  const feeQuery = useQuery({
    queryKey: ["book", "fee"],
    enabled: isPatient && !!readonlyContract,
    queryFn: async () => {
      const fee = await readonlyContract.appointmentFeeWei();
      return {
        wei: fee,
        eth: Number(ethers.formatEther(fee))
      };
    }
  });

  const bookAppointment = useMutation({
    mutationFn: async ({ doctorId, startAt }) => {
      if (!signerContract) throw new Error("Connect with a registered patient wallet.");
      const tx = await signerContract.bookAppointment(
        patientId,
        Number(doctorId),
        startAt,
        { value: feeQuery.data.wei }
      );
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "appointments", patientId] });
      setToast({ type: "success", message: "Appointment booked successfully." });
    },
    onError: (error) =>
      setToast({ type: "error", message: error.message || "Booking failed. Check details." })
  });

  if (!isPatient) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Book Appointment</h2>
          <p>Connect with a registered patient wallet to continue.</p>
        </div>
      </section>
    );
  }

  const doctorOptions =
    doctorsQuery.data?.map((doctor) => {
      const name = doctor.displayName?.trim?.();
      const labelName = name && name.length ? name : doctor.humanId || formatEntityId("DOC", doctor.id);
      const docId = formatEntityId("DOC", doctor.id);
      return {
        value: doctor.id,
        label: `${labelName} (${docId})`
      };
    }) || [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Book Appointment</h2>
          <p>Select an approved doctor and schedule a time.</p>
        </div>
      </header>

      {/* Booking Form Section */}
      <section className="panel">
        <h3>Book Your Appointment</h3>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const doctorId = form.get("doctorId");
            const startTime = form.get("start") ? new Date(form.get("start")) : null;
            if (!startTime || Number.isNaN(startTime.getTime())) {
              setWarning({
                title: "Invalid Date/Time",
                message: "Please choose a valid date and time for your appointment."
              });
              return;
            }
            
            // Ensure appointment is at least 5 minutes in the future
            const now = new Date();
            const minFutureTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
            if (startTime <= minFutureTime) {
              setWarning({
                title: "Appointment Time Invalid",
                message: "Your appointment must be scheduled at least 5 minutes in the future. The blockchain will reject appointments in the past or too close to the current time. Please select a later date and time."
              });
              return;
            }
            
            const startAt = Math.floor(startTime.getTime() / 1000);
            bookAppointment.mutate({ doctorId, startAt });
            event.currentTarget.reset();
          }}
        >
          <SelectField
            name="doctorId"
            label="Doctor"
            options={doctorOptions}
            required
            placeholder={doctorOptions.length ? "Select doctor" : "No approved doctors available"}
          />
          <InputField
            name="start"
            label="Start Time"
            type="datetime-local"
            required
            min={(() => {
              const now = new Date();
              now.setMinutes(now.getMinutes() + 10);
              return now.toISOString().slice(0, 16);
            })()}
            helper={
              feeQuery.isLoading
                ? "Fetching fee…"
                : `Appointment fee: ${feeQuery.data?.eth.toFixed(4)} ETH. Select future date/time.`
            }
          />
          <button type="submit" className="primary-btn" disabled={bookAppointment.isPending}>
            {bookAppointment.isPending ? "Booking…" : "Book Appointment"}
          </button>
        </form>
      </section>

      {/* Doctor List Section */}
      {doctorsQuery.isLoading ? (
        <section className="panel">
          <p>Loading doctors...</p>
        </section>
      ) : doctorsQuery.data && doctorsQuery.data.length > 0 ? (
        <section className="panel">
          <h3>Available Doctors</h3>
          <div className="doctors-list">
            {doctorsQuery.data.map((doctor) => (
              <DoctorStrip key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </section>
      ) : (
        <section className="panel">
          <p>No approved doctors available at the moment.</p>
        </section>
      )}

      {warning && (
        <WarningModal
          open={true}
          title={warning.title}
          message={warning.message}
          onClose={() => setWarning(null)}
        />
      )}

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
