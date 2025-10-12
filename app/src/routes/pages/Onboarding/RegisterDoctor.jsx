import { useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "../../../components/Forms/InputField.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import "./Onboarding.css";

export default function RegisterDoctor() {
  const { signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);

  const feeQuery = useQuery({
    queryKey: ["onboard", "doctor-fee"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      const fee = await readonlyContract.doctorRegFeeWei();
      return {
        wei: fee,
        eth: Number(ethers.formatEther(fee))
      };
    }
  });

  const registerDoctor = useMutation({
    mutationFn: async ({ ipfs }) => {
      if (!signerContract) throw new Error("Connect your wallet before registering.");
      const tx = await signerContract.registerDoctor(ipfs, { value: feeQuery.data.wei });
      await tx.wait();
    },
    onSuccess: () => setToast({ type: "success", message: "Registration submitted. Await approval." }),
    onError: (error) => setToast({ type: "error", message: error.message || "Registration failed." })
  });

  return (
    <section className="onboard-page">
      <div className="panel">
        <h2>Doctor Registration</h2>
        <p>
          Submit your profile metadata (IPFS JSON) to join HealthcareLite. Admin approval is required
          before you can prescribe medicines.
        </p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            registerDoctor.mutate({ ipfs: form.get("ipfs") });
            event.currentTarget.reset();
          }}
        >
          <InputField
            name="ipfs"
            label="Profile Metadata"
            placeholder="ipfs://..."
            required
            helper="Upload JSON with your credentials and provide the CID"
            autoComplete="off"
          />
          <button
            type="submit"
            className="primary-btn"
            disabled={registerDoctor.isPending || !feeQuery.data}
          >
            {registerDoctor.isPending
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
