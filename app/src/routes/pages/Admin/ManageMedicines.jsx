import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import MedicineCard from "../../../components/Cards/MedicineCard.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchMedicines } from "../../../lib/queries.js";
import "./Admin.css";

export default function ManageMedicines() {
  const queryClient = useQueryClient();
  const { role, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);

  const isAdmin = role === ROLES.ADMIN;

  const medicinesQuery = useQuery({
    queryKey: ["admin", "medicines"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchMedicines(readonlyContract, { includeInactive: true })
  });

  const setPrice = useMutation({
    mutationFn: async ({ id, price }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const tx = await signerContract.setMedicinePrice(id, ethers.parseEther(String(price)));
      await tx.wait();
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      setToast({ type: "success", message: `Updated price for medicine #${variables.id}.` });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to update price." })
  });

  const setStock = useMutation({
    mutationFn: async ({ id, stock }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const tx = await signerContract.setMedicineStock(id, Number(stock));
      await tx.wait();
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      setToast({ type: "success", message: `Updated stock for medicine #${variables.id}.` });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to update stock." })
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const tx = await signerContract.toggleMedicine(id);
      await tx.wait();
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      setToast({ type: "success", message: `Toggled medicine #${variables.id}.` });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to toggle medicine." })
  });

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Manage Medicines</h2>
          <p>Access denied. Connect with the admin wallet.</p>
        </div>
      </section>
    );
  }

  const medicines = medicinesQuery.data || [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Medicine Catalogue</h2>
          <p>Update pricing, stock, and availability for each medicine.</p>
        </div>
        <div className="page-actions">
          <a href="/admin/add-medicine" className="btn-add">
            ➕ Add Medicine
          </a>
        </div>
      </header>

      <div className="card-grid">
        {medicinesQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="panel skeleton-card" />
          ))}
        {!medicinesQuery.isLoading && medicines.length === 0 && (
          <div className="panel">
            <p>No medicines have been added yet.</p>
          </div>
        )}

        {medicines.map((medicine) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            footer={
              <div className="medicine-actions">
                <form
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    setPrice.mutate({
                      id: medicine.id,
                      price: form.get("price")
                    });
                    event.currentTarget.reset();
                  }}
                >
                  <InputField
                    name="price"
                    label="Price (ETH)"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder={medicine.priceEth.toFixed(4)}
                  />
                  <button type="submit" className="secondary-btn" disabled={setPrice.isPending}>
                    {setPrice.isPending ? "Saving…" : "Update"}
                  </button>
                </form>

                <form
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    setStock.mutate({
                      id: medicine.id,
                      stock: form.get("stock")
                    });
                    event.currentTarget.reset();
                  }}
                >
                  <InputField
                    name="stock"
                    label="Stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(medicine.stock)}
                  />
                  <button type="submit" className="secondary-btn" disabled={setStock.isPending}>
                    {setStock.isPending ? "Saving…" : "Update"}
                  </button>
                </form>

                <button
                  type="button"
                  className="tertiary-btn"
                  onClick={() => toggleActive.mutate({ id: medicine.id })}
                  disabled={toggleActive.isPending}
                >
                  {toggleActive.isPending ? "Updating…" : medicine.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            }
          />
        ))}
      </div>

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
