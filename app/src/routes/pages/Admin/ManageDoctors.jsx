import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DoctorCard from "../../../components/Cards/DoctorCard.jsx";
import ConfirmModal from "../../../components/Modals/ConfirmModal.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchDoctors } from "../../../lib/queries.js";
import "./Admin.css";

export default function ManageDoctors() {
  const queryClient = useQueryClient();
  const { role, signerContract, readonlyContract } = useWeb3();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = role === ROLES.ADMIN;

  const doctorsQuery = useQuery({
    queryKey: ["admin", "doctors"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchDoctors(readonlyContract)
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approve }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const tx = await signerContract.approveDoctor(id, approve);
      await tx.wait();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "doctors"] });
      setToast({
        type: "success",
        message: `Doctor #${variables.id} ${variables.approve ? "approved" : "revoked"}.`
      });
      setSelectedDoctor(null);
    },
    onError: (error) => {
      setToast({ type: "error", message: error.message || "Failed to update doctor." });
    }
  });

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Manage Doctors</h2>
          <p>Access denied. Connect with the admin wallet.</p>
        </div>
      </section>
    );
  }

  const doctors = doctorsQuery.data || [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Doctor Approvals</h2>
          <p>Review and manage registered doctors.</p>
        </div>
      </header>

      <div className="card-grid">
        {doctorsQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="panel skeleton-card" />
          ))}
        {!doctorsQuery.isLoading && doctors.length === 0 && (
          <div className="panel">
            <p>No doctors registered yet.</p>
          </div>
        )}
        {doctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            actionLabel={doctor.approved ? "Revoke Access" : "Approve Doctor"}
            actionDisabled={toggleApproval.isPending && selectedDoctor?.id === doctor.id}
            onAction={() => setSelectedDoctor(doctor)}
          />
        ))}
      </div>

      <ConfirmModal
        open={Boolean(selectedDoctor)}
        title={
          selectedDoctor?.approved
            ? "Revoke doctor's approval?"
            : "Approve this doctor for prescribing?"
        }
        description={
          selectedDoctor?.approved
            ? "Revoking approval will prevent this doctor from prescribing medicines."
            : "Approving grants this doctor the ability to prescribe medicines."
        }
        confirmLabel={selectedDoctor?.approved ? "Revoke" : "Approve"}
        onConfirm={() =>
          toggleApproval.mutate({
            id: selectedDoctor.id,
            approve: !selectedDoctor.approved
          })
        }
        onCancel={() => setSelectedDoctor(null)}
        loading={toggleApproval.isPending}
      />

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
