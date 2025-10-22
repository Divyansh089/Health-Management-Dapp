import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DoctorCard from "../../../components/Cards/DoctorCard.jsx";
import ConfirmModal from "../../../components/Modals/ConfirmModal.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { formatEntityId } from "../../../lib/format.js";
import { fetchDoctors } from "../../../lib/queries.js";
import { useSearch } from "../../../state/SearchContext.jsx";
import "./Admin.css";

export default function ManageDoctors() {
  const queryClient = useQueryClient();
  const { role, signerContract, readonlyContract } = useWeb3();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [toast, setToast] = useState(null);
  const { query, setPlaceholder, clearQuery } = useSearch();

  const isAdmin = role === ROLES.ADMIN;

  useEffect(() => {
    setPlaceholder("Search doctors by ID or wallet");
    return () => {
      setPlaceholder();
      clearQuery();
    };
  }, [setPlaceholder, clearQuery]);

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
        message: `${variables.humanId || formatEntityId("DOC", variables.id)} ${
          variables.approve ? "approved" : "revoked"
        }.`
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
  const filteredDoctors = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter((doctor) => {
      const values = [doctor.humanId, doctor.account, doctor.ipfs, String(doctor.id)]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return values.some((value) => value.includes(term));
    });
  }, [doctors, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Doctor Approvals</h2>
          <p>Review and manage registered doctors.</p>
        </div>
        <div className="page-actions">
          <a href="/admin/add-doctor" className="btn-add">
            ➕ Add Doctor by Wallet
          </a>
          <a href="/onboard/doctor" className="btn-add secondary">
            👤 Self Registration Form
          </a>
        </div>
      </header>

      <div className="card-grid">
        {doctorsQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="panel skeleton-card" />
          ))}
        {!doctorsQuery.isLoading && filteredDoctors.length === 0 && (
          <div className="panel">
            <p>{hasQuery ? "No doctors match your search." : "No doctors registered yet."}</p>
          </div>
        )}
        {filteredDoctors.map((doctor) => (
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
            humanId: selectedDoctor.humanId,
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
