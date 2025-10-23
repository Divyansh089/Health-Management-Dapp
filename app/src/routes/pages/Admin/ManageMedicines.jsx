import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MedicineDetailModal from "../../../components/Modals/MedicineDetailModal.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import { fetchMedicines } from "../../../lib/queries.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import {
  MEDICINE_REQUESTS_EVENT,
  getMedicineRequests,
  updateMedicineRequest
} from "../../../lib/medicineRequests.js";
import { fetchFromIPFS } from "../../../lib/ipfs.js";
import { useSearch } from "../../../state/SearchContext.jsx";
import "./Admin.css";
import "../../../components/Tables/Table.css";

export default function ManageMedicines() {
  const queryClient = useQueryClient();
  const { role, signerContract, readonlyContract } = useWeb3();
  const [toast, setToast] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [priceUpdatingId, setPriceUpdatingId] = useState(null);
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const [toggleUpdatingId, setToggleUpdatingId] = useState(null);
  const [activeMedicineId, setActiveMedicineId] = useState(null);
  const { query, setPlaceholder, clearQuery } = useSearch();

  const isAdmin = role === ROLES.ADMIN;

  const refreshRequests = useCallback((maybeSource) => {
    const list = Array.isArray(maybeSource) ? maybeSource : getMedicineRequests();
    setRequests(list);
    setSelectedRequest((prev) => {
      if (!prev) return null;
      const match = list.find((item) => item.id === prev.id);
      return match || null;
    });
  }, []);

  useEffect(() => {
    setRequestsLoading(true);
    try {
      refreshRequests();
    } finally {
      setRequestsLoading(false);
    }
    if (typeof window === "undefined") {
      return undefined;
    }
    const handler = (event) => {
      const incoming = event?.detail?.requests;
      refreshRequests(Array.isArray(incoming) ? incoming : undefined);
    };
    window.addEventListener(MEDICINE_REQUESTS_EVENT, handler);
    return () => {
      window.removeEventListener(MEDICINE_REQUESTS_EVENT, handler);
    };
  }, [refreshRequests]);

  const getUrgencyColor = (level) => {
    switch ((level || "normal").toLowerCase()) {
      case "urgent":
        return "#ff4757";
      case "high":
        return "#ff6b4a";
      case "low":
        return "#5f27cd";
      default:
        return "#2563eb";
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "pending").toLowerCase()) {
      case "approved":
        return "#2ed573";
      case "rejected":
        return "#ff4757";
      case "pending":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  useEffect(() => {
    setPlaceholder("Search medicines by ID or name");
    return () => {
      setPlaceholder();
      clearQuery();
    };
  }, [setPlaceholder, clearQuery]);

  const medicinesQuery = useQuery({
    queryKey: ["admin", "medicines"],
    enabled: isAdmin && !!readonlyContract,
    queryFn: () => fetchMedicines(readonlyContract, { includeInactive: true })
  });

  const setPrice = useMutation({
    mutationFn: async ({ id, price }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const raw = typeof price === "string" ? price.trim() : String(price ?? "");
      if (!raw) throw new Error("Enter a price in ETH.");
      const numeric = Number(raw);
      if (!Number.isFinite(numeric) || numeric < 0) {
        throw new Error("Price must be a non-negative number.");
      }
      const tx = await signerContract.setMedicinePrice(id, ethers.parseEther(raw));
      await tx.wait();
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      const label = variables.humanId || formatEntityId("MED", variables.id);
      setToast({ type: "success", message: `Updated price for ${label}.` });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to update price." }),
    onMutate: ({ id }) => {
      setPriceUpdatingId(id);
    },
    onSettled: () => {
      setPriceUpdatingId(null);
    }
  });

  const setStock = useMutation({
    mutationFn: async ({ id, stock }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const raw = typeof stock === "string" ? stock.trim() : String(stock ?? "");
      if (!raw) throw new Error("Enter a stock quantity.");
      const numeric = Number(raw);
      if (!Number.isFinite(numeric) || numeric < 0) {
        throw new Error("Stock must be zero or greater.");
      }
      const tx = await signerContract.setMedicineStock(id, Math.trunc(numeric));
      await tx.wait();
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      const label = variables.humanId || formatEntityId("MED", variables.id);
      setToast({ type: "success", message: `Updated stock for ${label}.` });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to update stock." }),
    onMutate: ({ id }) => {
      setStockUpdatingId(id);
    },
    onSettled: () => {
      setStockUpdatingId(null);
    }
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id }) => {
      if (!signerContract) throw new Error("Connect your admin wallet.");
      const tx = await signerContract.toggleMedicine(id);
      await tx.wait();
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      const label = variables.humanId || formatEntityId("MED", variables.id);
      setToast({ type: "success", message: `Toggled ${label}.` });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to toggle medicine." }),
    onMutate: ({ id }) => {
      setToggleUpdatingId(id);
    },
    onSettled: () => {
      setToggleUpdatingId(null);
    }
  });

  const handlePriceSubmit = useCallback(
    (medicine, priceValue) => {
      if (!medicine) return;
      const id = Number(medicine.id);
      if (!Number.isFinite(id)) return;
      setPrice.mutate({
        id,
        humanId: medicine.humanId || formatEntityId("MED", medicine.id),
        price: priceValue
      });
    },
    [setPrice]
  );

  const handleStockSubmit = useCallback(
    (medicine, stockValue) => {
      if (!medicine) return;
      const id = Number(medicine.id);
      if (!Number.isFinite(id)) return;
      setStock.mutate({
        id,
        humanId: medicine.humanId || formatEntityId("MED", medicine.id),
        stock: stockValue
      });
    },
    [setStock]
  );

  const handleToggleActive = useCallback(
    (medicine) => {
      if (!medicine) return;
      const id = Number(medicine.id);
      if (!Number.isFinite(id)) return;
      toggleActive.mutate({
        id,
        humanId: medicine.humanId || formatEntityId("MED", medicine.id)
      });
    },
    [toggleActive]
  );

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
  const activeMedicine = useMemo(() => {
    if (activeMedicineId == null) return null;
    const targetId = Number(activeMedicineId);
    if (!Number.isFinite(targetId)) return null;
    return medicines.find((item) => Number(item.id) === targetId) || null;
  }, [activeMedicineId, medicines]);
  const sortedRequests = useMemo(() => {
    if (!requests.length) return [];
    const priority = (status) => {
      const normalized = (status || "pending").toLowerCase();
      if (normalized === "pending") return 0;
      if (normalized === "approved") return 1;
      if (normalized === "rejected") return 2;
      return 3;
    };
    return [...requests].sort((a, b) => {
      const byPriority = priority(a.status) - priority(b.status);
      if (byPriority !== 0) return byPriority;
      return new Date(b.requestDate || 0).getTime() - new Date(a.requestDate || 0).getTime();
    });
  }, [requests]);
  const pendingRequests = sortedRequests.filter((req) => (req.status || "pending").toLowerCase() === "pending");
  const filteredMedicines = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return medicines;
    return medicines.filter((medicine) => {
      const values = [
        medicine.humanId,
        medicine.displayName,
        medicine.genericName,
        medicine.manufacturer,
        medicine.description,
        medicine.ipfs,
        String(medicine.priceEth),
        String(medicine.stock),
        medicine.active ? "active" : "inactive",
        String(medicine.id)
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return values.some((value) => value.includes(term));
    });
  }, [medicines, query]);
  const hasQuery = query.trim().length > 0;
  const showRequestsPanel = requestsLoading || pendingRequests.length > 0;

  const handleApproveRequest = useCallback(
    async (request) => {
      if (!request) return;
      if (!signerContract) {
        setToast({ type: "error", message: "Connect the admin wallet to approve medicine requests." });
        return;
      }
      try {
        setProcessingRequestId(request.id);
        let metadata = request.metadata || null;
        if (request.ipfsCid) {
          try {
            metadata = await fetchFromIPFS(request.ipfsCid);
          } catch (error) {
            console.warn("IPFS fetch failed, falling back to embedded metadata.", error);
            if (!metadata) throw error;
          }
        }

        const priceSource = metadata?.price ?? request.price;
        const priceValue = typeof priceSource === "string"
          ? parseFloat(priceSource.trim())
          : Number(priceSource);
        if (!Number.isFinite(priceValue) || priceValue <= 0) {
          throw new Error("Invalid price value in request metadata.");
        }

        const stockSource = metadata?.stock ?? request.stock ?? metadata?.quantity ?? request.quantity;
        const stockValue = typeof stockSource === "string"
          ? parseFloat(stockSource.trim())
          : Number(stockSource);
        if (!Number.isFinite(stockValue) || stockValue < 0) {
          throw new Error("Invalid stock value in request metadata.");
        }

        const pointer =
          request.ipfsUrl ||
          (typeof metadata?.ipfsUrl === "string" ? metadata.ipfsUrl : undefined) ||
          (request.ipfsCid ? `ipfs://${request.ipfsCid}` : undefined);

        if (!pointer) {
          throw new Error("Missing IPFS metadata pointer for this request.");
        }

        const tx = await signerContract.addMedicine(
          pointer,
          ethers.parseEther(priceValue.toString()),
          Math.trunc(stockValue)
        );
        await tx.wait();

        updateMedicineRequest(request.id, {
          status: "approved",
          processedAt: new Date().toISOString()
        });

        refreshRequests();
        setSelectedRequest(null);
        queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
        setToast({ type: "success", message: `Approved ${request.medicineName} and added to catalogue.` });
      } catch (error) {
        console.error("Error approving medicine request:", error);
        setToast({ type: "error", message: error.message || "Failed to approve medicine request." });
      } finally {
        setProcessingRequestId(null);
      }
    },
    [refreshRequests, queryClient, setToast, signerContract]
  );

  const handleRejectRequest = useCallback(
    async (request) => {
      if (!request) return;
      try {
        setProcessingRequestId(request.id);
        updateMedicineRequest(request.id, {
          status: "rejected",
          processedAt: new Date().toISOString()
        });
        refreshRequests();
        setSelectedRequest(null);
        setToast({ type: "success", message: `Rejected ${request.medicineName}.` });
      } catch (error) {
        console.error("Error rejecting medicine request:", error);
        setToast({ type: "error", message: error.message || "Failed to reject medicine request." });
      } finally {
        setProcessingRequestId(null);
      }
    },
    [refreshRequests, setToast]
  );

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

      {showRequestsPanel && (
        <div className="panel requests-panel">
          <div className="requests-header">
            <div>
              <h3>Doctor Medicine Requests</h3>
              <p className="requests-subtitle">Approve incoming submissions without leaving this page.</p>
            </div>
            <span className="requests-counter">
              {pendingRequests.length} pending
            </span>
          </div>

          {requestsLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading medicine requests...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Medicine</th>
                      <th>Price (ETH)</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => {
                      const hasPrice = request.price !== null && request.price !== "" && Number.isFinite(Number(request.price));
                      const displayPrice = hasPrice ? `${Number(request.price).toFixed(4)} ETH` : "—";
                      const key = request.id ?? request.ipfsCid ?? request.requestDate;
                      return (
                        <tr
                          key={key}
                          className={selectedRequest && selectedRequest.id === request.id ? "request-row-selected" : undefined}
                        >
                          <td>
                            <div className="doctor-info">
                              <strong>{request.doctorName || "Unknown Doctor"}</strong>
                              <small>{request.doctorId ? formatEntityId("DOC", request.doctorId) : "—"}</small>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => setSelectedRequest(request)}
                            >
                              {request.medicineName || "Untitled"}
                            </button>
                          </td>
                          <td>{displayPrice}</td>
                          <td>
                            <span
                              className="status-badge"
                              style={{ backgroundColor: getUrgencyColor(request.urgencyLevel) }}
                            >
                              {(request.urgencyLevel || "normal").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(request.status) }}
                            >
                              {(request.status || "pending").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn-approve"
                                onClick={() => handleApproveRequest(request)}
                                disabled={processingRequestId === request.id}
                              >
                                {processingRequestId === request.id ? "Processing…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => handleRejectRequest(request)}
                                disabled={processingRequestId === request.id}
                              >
                                {processingRequestId === request.id ? "Working…" : "Reject"}
                              </button>
                              <button
                                type="button"
                                className="link-button request-view"
                                onClick={() => setSelectedRequest(request)}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedRequest && (
                <div className="request-details">
                  <h4>Request Details</h4>
                  {(selectedRequest.imageUrl || selectedRequest.image) && (
                    <div className="request-image-preview">
                      <img
                        src={selectedRequest.imageUrl || selectedRequest.image}
                        alt={selectedRequest.medicineName || "Medicine preview"}
                        onError={(event) => event.currentTarget.classList.add("hidden")}
                      />
                    </div>
                  )}
                  <div className="details-grid">
                  <div>
                    <strong>Medicine</strong>
                    <p>{selectedRequest.medicineName || "—"}</p>
                  </div>
                  <div>
                    <strong>Generic Name</strong>
                    <p>{selectedRequest.genericName || "—"}</p>
                  </div>
                  <div>
                    <strong>Price</strong>
                    <p>
                      {selectedRequest.price !== null && selectedRequest.price !== "" && Number.isFinite(Number(selectedRequest.price))
                        ? `${Number(selectedRequest.price).toFixed(4)} ETH`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <strong>Initial Stock</strong>
                    <p>
                      {selectedRequest.stock !== null && selectedRequest.stock !== "" && Number.isFinite(Number(selectedRequest.stock))
                        ? Number(selectedRequest.stock)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <strong>Urgency</strong>
                    <p>{(selectedRequest.urgencyLevel || "normal").toUpperCase()}</p>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <p>{(selectedRequest.status || "pending").toUpperCase()}</p>
                  </div>
                  <div>
                    <strong>Doctor</strong>
                    <p>{selectedRequest.doctorName || "—"}</p>
                  </div>
                  <div>
                    <strong>Doctor ID</strong>
                    <p>{selectedRequest.doctorId ? formatEntityId("DOC", selectedRequest.doctorId) : "—"}</p>
                  </div>
                  <div>
                    <strong>Doctor Wallet</strong>
                    <p className="truncate">{selectedRequest.doctorAddress || "—"}</p>
                  </div>
                  <div>
                    <strong>Dosage Form</strong>
                    <p>{selectedRequest.dosageForm || "—"}</p>
                  </div>
                  <div>
                    <strong>Strength</strong>
                    <p>{selectedRequest.strength || "—"}</p>
                  </div>
                  <div>
                    <strong>Batch</strong>
                    <p>{selectedRequest.batch || "—"}</p>
                  </div>
                  <div>
                    <strong>Expiry</strong>
                    <p>{selectedRequest.expiry || "—"}</p>
                  </div>
                  <div>
                    <strong>Regulatory ID</strong>
                    <p>{selectedRequest.regulatoryId || "—"}</p>
                  </div>
                  {selectedRequest.therapeuticClass && (
                    <div>
                      <strong>Therapeutic Class</strong>
                      <p>{selectedRequest.therapeuticClass}</p>
                    </div>
                  )}
                  <div className="full-width">
                    <strong>Description</strong>
                    <p>{selectedRequest.description || "—"}</p>
                  </div>
                  <div className="full-width">
                    <strong>Request Reason</strong>
                    <p>{selectedRequest.requestReason || "No justification provided."}</p>
                  </div>
                  {selectedRequest.ingredients?.length ? (
                    <div className="full-width">
                      <strong>Ingredients</strong>
                      <ul className="pill-list">
                        {selectedRequest.ingredients.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {selectedRequest.storage?.length ? (
                    <div className="full-width">
                      <strong>Storage Conditions</strong>
                      <ul className="pill-list">
                        {selectedRequest.storage.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <footer className="details-footer">
                  <div>
                    <small>Submitted: {formatDate(selectedRequest.requestDate) || "—"}</small>
                  </div>
                  {selectedRequest.ipfsCid && (
                    <a
                      className="link-button"
                      href={`https://ipfs.io/ipfs/${selectedRequest.ipfsCid}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Metadata →
                    </a>
                  )}
                </footer>
              </div>
            )}
          </>
        )}
        </div>
      )}

      <div className="medicine-strip-list">
        {medicinesQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="medicine-strip skeleton" />
          ))}
        {!medicinesQuery.isLoading && filteredMedicines.length === 0 && (
          <div className="panel">
            <p>{hasQuery ? "No medicines match your search." : "No medicines have been added yet."}</p>
          </div>
        )}

        {filteredMedicines.map((medicine) => {
          const displayName =
            medicine.displayName?.trim?.() ||
            medicine.metadata?.name?.trim?.() ||
            medicine.genericName?.trim?.() ||
            medicine.humanId ||
            formatEntityId("MED", medicine.id);
          const subtitle = medicine.genericName?.trim?.() || medicine.manufacturer || "";
          const imageUrl = medicine.imageUrl;
          const fallbackInitial = (displayName || medicine.humanId || "M").charAt(0).toUpperCase();

          return (
            <article
              key={medicine.id}
              className={`medicine-strip ${medicine.active ? "active" : "inactive"}`}
            >
              <div className="strip-thumb">
                {!imageUrl ? (
                  <div className="strip-thumb-fallback">{fallbackInitial}</div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`${displayName} preview`}
                    onError={(event) => {
                      // Replace the failed image with fallback
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'strip-thumb-fallback';
                      fallbackDiv.textContent = fallbackInitial;
                      event.currentTarget.parentElement?.replaceChild(fallbackDiv, event.currentTarget);
                    }}
                  />
                )}
              </div>

              <div className="strip-main">
                <div className="strip-header">
                  <div className="strip-title-group">
                    <h3 className="strip-title">{displayName}</h3>
                    <span className="strip-subtitle">
                      {subtitle ? `${subtitle} • ` : ""}
                      {medicine.humanId || formatEntityId("MED", medicine.id)}
                    </span>
                  </div>
                  <span className={`strip-status ${medicine.active ? "active" : "inactive"}`}>
                    {medicine.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="strip-meta">
                  <div className="strip-meta-item">
                    <span>Price</span>
                    <strong>{(medicine.priceEth?.toFixed?.(4) ?? medicine.priceEth) || 0} ETH</strong>
                  </div>
                  <div className="strip-meta-item">
                    <span>Stock</span>
                    <strong>{medicine.stock}</strong>
                  </div>
                  <div className="strip-meta-item">
                    <span>Manufacturer</span>
                    <strong>{medicine.manufacturer || "—"}</strong>
                  </div>
                </div>
              </div>

              <div className="strip-actions">
                <button
                  type="button"
                  className="strip-view-btn"
                  onClick={() => setActiveMedicineId(Number(medicine.id))}
                >
                  View Details
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          duration={4000}
        />
      )}

      {activeMedicine && (
        <MedicineDetailModal
          medicine={activeMedicine}
          onClose={() => setActiveMedicineId(null)}
          onSubmitPrice={handlePriceSubmit}
          onSubmitStock={handleStockSubmit}
          onToggleActive={handleToggleActive}
          pricePending={priceUpdatingId != null && Number(priceUpdatingId) === Number(activeMedicine.id)}
          stockPending={stockUpdatingId != null && Number(stockUpdatingId) === Number(activeMedicine.id)}
          togglePending={toggleUpdatingId != null && Number(toggleUpdatingId) === Number(activeMedicine.id)}
        />
      )}
    </section>
  );
}
