import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import Toast from "../../../components/Toast/Toast.jsx";
import "../../../components/Tables/Table.css";
import "../../../components/Toast/Toast.css";
import { fetchMedicineRequests } from "../../../lib/queries.js";
import { fetchFromIPFS } from "../../../lib/ipfs.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import "./Admin.css";

export default function MedicineRequests() {
  const queryClient = useQueryClient();
  const { signerContract, readonlyContract, role } = useWeb3();
  const [toast, setToast] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const requestsQuery = useQuery({
    queryKey: ["admin", "medicine-requests"],
    enabled: !!readonlyContract,
    queryFn: () => fetchMedicineRequests(readonlyContract)
  });

  const requests = useMemo(() => requestsQuery.data || [], [requestsQuery.data]);
  const selectedRequest = useMemo(() => requests.find((item) => item.id === selectedId) || requests[0] || null, [requests, selectedId]);

  const approveMutation = useMutation({
    mutationFn: async (request) => {
      if (!signerContract) throw new Error("Connect the admin wallet to approve requests.");
      const metadataCid = request.metadataCid;
      if (!metadataCid) throw new Error("Missing metadata pointer.");
      const metadata = request.metadata || (await fetchFromIPFS(metadataCid));
      const price = Number(metadata.price || metadata.priceEth || 0);
      const stock = Number(metadata.stock || metadata.quantity || 0);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price in metadata.");
      if (!Number.isFinite(stock) || stock < 0) throw new Error("Invalid stock in metadata.");
      const ipfsPointer = metadataCid.startsWith("ipfs://") ? metadataCid : `ipfs://${metadataCid}`;
      const tx = await signerContract.addMedicine(ipfsPointer, ethers.parseEther(price.toString()), Math.trunc(stock));
      await tx.wait();
      if (request.id) {
        const statusTx = await signerContract.setMedicineRequestStatus(request.id, true);
        await statusTx.wait();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicine-requests"] });
      setToast({ type: "success", message: "Request approved and medicine added." });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Approval failed." })
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Medicine Requests</h2>
          <p>Review submissions from doctors and add vetted medicines to the catalog.</p>
        </div>
      </header>

      <section className="panel">
        <h3>Pending Requests</h3>
        {requestsQuery.isLoading ? (
          <p>Loading…</p>
        ) : requests.length === 0 ? (
          <p>No requests submitted.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Doctor</th>
                <th>Medicine</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id || request.metadataCid} className={selectedRequest?.id === request.id ? "active" : ""}>
                  <td>{formatEntityId("REQ", request.id || 0)}</td>
                  <td>{formatEntityId("DOC", request.doctorId || 0)}</td>
                  <td>{request.metadata?.medicineName || request.metadata?.name || "Unnamed"}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>{request.processed ? "Processed" : "Pending"}</td>
                  <td>
                    <button type="button" className="link-button" onClick={() => setSelectedId(request.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedRequest && (
        <section className="panel">
          <header className="panel-header">
            <div>
              <h3>{selectedRequest.metadata?.medicineName || selectedRequest.metadata?.name || "Request"}</h3>
              <p>Submitted {formatDate(selectedRequest.createdAt)} by {formatEntityId("DOC", selectedRequest.doctorId || 0)}</p>
            </div>
            <div className="panel-actions">
              <button
                type="button"
                className="primary-btn"
                disabled={approveMutation.isPending || selectedRequest.processed}
                onClick={() => approveMutation.mutate(selectedRequest)}
              >
                {approveMutation.isPending ? "Approving…" : selectedRequest.processed ? "Processed" : "Approve"}
              </button>
            </div>
          </header>
          <div className="details-grid">
            <DetailItem label="Generic Name" value={selectedRequest.metadata?.genericName} />
            <DetailItem label="Manufacturer" value={selectedRequest.metadata?.manufacturer} />
            <DetailItem label="Dosage Form" value={selectedRequest.metadata?.dosageForm} />
            <DetailItem label="Strength" value={selectedRequest.metadata?.strength} />
            <DetailItem label="Price" value={`${selectedRequest.metadata?.price || "0"} ETH`} />
            <DetailItem label="Desired Stock" value={selectedRequest.metadata?.stock} />
            <DetailItem label="Urgency" value={selectedRequest.metadata?.urgencyLevel} />
            <DetailItem label="Expiry" value={selectedRequest.metadata?.expiry} />
            <DetailItem label="Regulatory ID" value={selectedRequest.metadata?.regulatoryId} />
            <div className="full-width">
              <strong>Request Reason</strong>
              <p>{selectedRequest.metadata?.requestReason || "No reason provided."}</p>
            </div>
            <div className="full-width">
              <strong>Description</strong>
              <p>{selectedRequest.metadata?.description || "No description provided."}</p>
            </div>
            {selectedRequest.metadata?.storage?.length ? (
              <div className="full-width">
                <strong>Storage</strong>
                <ul className="pill-list">
                  {selectedRequest.metadata.storage.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {selectedRequest.metadataCid && (
            <footer className="panel-footer">
              <a
                className="link-button"
                href={`https://ipfs.io/ipfs/${selectedRequest.metadataCid.replace(/^ipfs:\/\//, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                View Metadata on IPFS
              </a>
            </footer>
          )}
        </section>
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

function DetailItem({ label, value }) {
  return (
    <div>
      <strong>{label}</strong>
      <p>{value ? String(value) : "None"}</p>
    </div>
  );
}
