import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import "./Onboarding.css";

export default function RegisterPatient() {
  const { signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);

  const feeQuery = useQuery({
    queryKey: ["onboard", "patient-fee"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      const fee = await readonlyContract.patientRegFeeWei();
      return {
        wei: fee,
        eth: Number(ethers.formatEther(fee))
      };
    }
  });

  const registerPatient = useMutation({
    mutationFn: async ({ ipfs }) => {
      if (!signerContract) throw new Error("Connect your wallet before registering.");
      const tx = await signerContract.registerPatient(ipfs, { value: feeQuery.data.wei });
      await tx.wait();
    },
    onSuccess: () =>
      setToast({ type: "success", message: "Welcome! You can now book appointments." }),
    onError: (error) => setToast({ type: "error", message: error.message || "Registration failed." })
  });

  return (
    <section className="onboard-page">
      <div className="panel">
        <h2>Patient Registration</h2>
        <p>Provide a link to your encrypted health profile stored on IPFS.</p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            registerPatient.mutate({ ipfs: form.get("ipfs") });
            event.currentTarget.reset();
          }}
        >
          <InputField
            name="ipfs"
            label="Profile Metadata"
            placeholder="ipfs://..."
            required
            helper="Include emergency info, medical history, or contact details as you prefer."
            autoComplete="off"
          />
          <button
            type="submit"
            className="primary-btn"
            disabled={registerPatient.isPending || !feeQuery.data}
          >
            {registerPatient.isPending
              ? "Submitting…"
              : `Register (${feeQuery.data?.eth?.toFixed(4) ?? "…"} ETH)`}
          </button>
        </form>
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
