import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import InputField from "../../../components/Forms/InputField.jsx";
import { getContract } from "../../../lib/contract.js";
import Toast from "../../../components/Toast/Toast.jsx";
import "./Admin.css";

export default function AdminFees() {
  const queryClient = useQueryClient();
  const feesQuery = useQuery({
    queryKey: ["admin", "fees"],
    queryFn: async () => {
      const contract = await getContract();
      const [doctorFeeWei, patientFeeWei, appointmentFeeWei] = await Promise.all([
        contract.doctorRegFeeWei(),
        contract.patientRegFeeWei(),
        contract.appointmentFeeWei()
      ]);
      return {
        doctor: Number(ethers.formatEther(doctorFeeWei)),
        patient: Number(ethers.formatEther(patientFeeWei)),
        appointment: Number(ethers.formatEther(appointmentFeeWei))
      };
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ doctor, patient, appointment }) => {
      const contract = await getContract();
      const tx = await contract.setFees(
        ethers.parseEther(String(doctor)),
        ethers.parseEther(String(patient)),
        ethers.parseEther(String(appointment))
      );
      await tx.wait();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "fees"] })
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Update Fees</h2>
          <p>Adjust registration and appointment fees for the MediFuse network.</p>
        </div>
      </header>

      <section className="panel">
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            mutation.mutate({
              doctor: form.get("doctor"),
              patient: form.get("patient"),
              appointment: form.get("appointment")
            });
          }}
        >
          <InputField
            name="doctor"
            label="Doctor Registration (ETH)"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={feesQuery.data?.doctor ?? ""}
            required
          />
          <InputField
            name="patient"
            label="Patient Registration (ETH)"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={feesQuery.data?.patient ?? ""}
            required
          />
          <InputField
            name="appointment"
            label="Appointment Booking (ETH)"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={feesQuery.data?.appointment ?? ""}
            required
          />
          <button type="submit" className="primary-btn" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Save Fees"}
          </button>
        </form>
      </section>

      {mutation.isSuccess && <Toast message="Fees updated" type="success" onDismiss={() => mutation.reset()} />}
      {mutation.isError && <Toast message="Failed to update fees" type="error" onDismiss={() => mutation.reset()} />}
    </section>
  );
}
