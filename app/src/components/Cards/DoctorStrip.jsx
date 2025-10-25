import { useState, useMemo } from "react";
import { formatEntityId } from "../../lib/format.js";
import DoctorProfileModal from "../Modals/DoctorProfileModal.jsx";

export default function DoctorStrip({ doctor, onApprove, onView, approving = false }) {
  const [open, setOpen] = useState(false);
  if (!doctor) return null;

  const successRate = useMemo(() => {
    if (!doctor.appointments) return null;
    const rate = Math.round((doctor.successes / doctor.appointments) * 100);
    return isFinite(rate) ? rate : null;
  }, [doctor.appointments, doctor.successes]);

  return (
    <div className={`doctor-strip ${doctor.approved ? "approved" : "pending"}`}>
      <div className="doctor-avatar" aria-hidden>
        {doctor.photoUrl ? (
          <img src={doctor.photoUrl} alt={doctor.displayName || doctor.humanId} />
        ) : (
          <span role="img" aria-label="doctor">🩺</span>
        )}
      </div>
      <div className="doctor-main">
        <div className="doctor-header">
          <div className="doctor-title-group">
            <h4 className="doctor-title">{doctor.displayName || doctor.humanId || formatEntityId("DOC", doctor.id)}</h4>
            <span className="doctor-account">{doctor.account}</span>
          </div>
          <span className={`doctor-status ${doctor.approved ? "approved" : "pending"}`}>
            {doctor.approved ? "Approved" : "Pending"}
          </span>
        </div>

        <div className="doctor-meta">
          <div className="meta-item">
            <span>Appointments</span>
            <strong>{doctor.appointments}</strong>
          </div>
          <div className="meta-item">
            <span>Successes</span>
            <strong>{doctor.successes}</strong>
          </div>
          <div className="meta-item">
            <span>Success rate</span>
            <strong>{successRate !== null ? `${successRate}%` : "—"}</strong>
          </div>
        </div>
      </div>

      <div className="doctor-actions">
        {doctor.ipfs ? (
          <button
            className="view-profile-btn"
            onClick={() => (onView ? onView(doctor) : setOpen(true))}
            type="button"
          >
            View
          </button>
        ) : (
          <span className="muted">No profile</span>
        )}

        {!doctor.approved && onApprove && (
          <button
            className="approve-btn"
            disabled={approving}
            onClick={() => onApprove && onApprove(doctor)}
            type="button"
          >
            {approving ? "Approving…" : "Approve Doctor"}
          </button>
        )}
      </div>

      {!onView && (
        <DoctorProfileModal doctor={doctor} isOpen={open} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
