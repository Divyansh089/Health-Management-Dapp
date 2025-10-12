import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchAllPrescriptions, fetchMedicines } from "../../../lib/queries.js";
import { formatDate } from "../../../lib/format.js";
import "./Patient.css";

export default function MyPrescriptions() {
  const queryClient = useQueryClient();
  const { role, patientId, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [pendingBuy, setPendingBuy] = useState(null);

  const isPatient = role === ROLES.PATIENT;

  const prescriptionsQuery = useQuery({
    queryKey: ["patient", "prescriptions", patientId],
    enabled: isPatient && !!readonlyContract,
    queryFn: async () => {
      const all = await fetchAllPrescriptions(readonlyContract);
      return all.filter((item) => item.patientId === patientId).sort((a, b) => b.date - a.date);
    }
  });

  const medicinesQuery = useQuery({
    queryKey: ["patient", "medicines", "for-prescriptions"],
    enabled: isPatient && !!readonlyContract,
    queryFn: () => fetchMedicines(readonlyContract, { includeInactive: true })
  });

  const buyMedicine = useMutation({
    mutationFn: async ({ medicineId, quantity }) => {
      if (!signerContract) throw new Error("Connect with a registered patient wallet.");
      const medicine = medicinesQuery.data?.find((m) => m.id === medicineId);
      if (!medicine) throw new Error("Medicine unavailable.");
      if (!medicine.active) throw new Error("Medicine currently inactive.");
      const totalWei = BigInt(medicine.priceWei) * BigInt(quantity);
      const tx = await signerContract.buyMedicine(patientId, medicineId, quantity, {
        value: totalWei
      });
      await tx.wait();
    },
    onMutate: (variables) => setPendingBuy(variables.medicineId),
    onSettled: () => setPendingBuy(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "prescriptions", patientId] });
      setToast({ type: "success", message: "Purchase successful. Check with your provider." });
    },
    onError: (error) =>
      setToast({ type: "error", message: error.message || "Could not complete purchase." })
  });

  if (!isPatient) {
    return (
      <section className="page">
        <div className="panel">
          <h2>My Prescriptions</h2>
          <p>Connect with a registered patient wallet to continue.</p>
        </div>
      </section>
    );
  }

  const prescriptions = prescriptionsQuery.data || [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Prescriptions</h2>
          <p>Review medicines prescribed by your doctors and purchase refills.</p>
        </div>
      </header>

      <section className="panel">
        {prescriptionsQuery.isLoading ? (
          <p>Loading prescriptions…</p>
        ) : prescriptions.length === 0 ? (
          <p>No prescriptions yet.</p>
        ) : (
          <div className="prescription-grid">
            {prescriptions.map((item) => {
              const medicine = medicinesQuery.data?.find((m) => m.id === item.medicineId);
              return (
                <article key={item.id} className="prescription-card">
                  <header>
                    <h3>Prescription #{item.id}</h3>
                    <span>{formatDate(item.date)}</span>
                  </header>
                  <div className="prescription-body">
                    <div>
                      <span className="tile-label">Medicine</span>
                      <strong className="tile-value">#{item.medicineId}</strong>
                      <span className="tile-sub">{medicine?.ipfs || "Metadata unavailable"}</span>
                    </div>
                    <div>
                      <span className="tile-label">Price</span>
                      <strong className="tile-value">
                        {medicine ? `${medicine.priceEth.toFixed(4)} ETH` : "Unknown"}
                      </strong>
                    </div>
                  </div>
                  {medicine && medicine.active ? (
                    <form
                      className="inline-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        const quantity = Number(form.get("qty"));
                        if (!quantity || quantity < 1) {
                          setToast({ type: "error", message: "Quantity must be at least 1." });
                          return;
                        }
                        buyMedicine.mutate({ medicineId: medicine.id, quantity });
                      }}
                    >
                      <InputField
                        name="qty"
                        label="Quantity"
                        type="number"
                        min="1"
                        defaultValue="1"
                        required
                      />
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={buyMedicine.isPending && pendingBuy === medicine.id}
                      >
                        {buyMedicine.isPending && pendingBuy === medicine.id
                          ? "Processing…"
                          : "Purchase"}
                      </button>
                    </form>
                  ) : (
                    <div className="alert">
                      {medicine ? "Currently unavailable." : "Medicine details missing."}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
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
