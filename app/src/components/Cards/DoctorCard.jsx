import { useState } from "react";
import "./Card.css";
import { formatDate, formatEntityId } from "../../lib/format.js";
import DoctorProfileModal from "../Modals/DoctorProfileModal.jsx";

export default function DoctorCard({
  doctor,
  onAction,
  actionLabel,
  actionDisabled = false,
  footer
}) {
  const [showProfile, setShowProfile] = useState(false);
  if (!doctor) return null;
  const successRate =
    doctor.appointments > 0
      ? Math.round((doctor.successes / doctor.appointments) * 100)
      : null;

  return (
    <article className={`card ${doctor.approved ? "card-approved" : "card-pending"}`}>
      <header className="card-header">
        <div>
          <h4>{doctor.humanId || formatEntityId("DOC", doctor.id)}</h4>
          <span className="card-subtitle">{doctor.account}</span>
        </div>
        <span className={`status-chip ${doctor.approved ? "status-success" : "status-muted"}`}>
          {doctor.approved ? "Approved" : "Pending"}
        </span>
      </header>

      <div className="card-body">
        <div className="card-row">
          <span>Profile</span>
          {doctor.ipfs ? (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowProfile(true);
              }}
              className="view-profile-btn"
              type="button"
            >
              View
            </button>
          ) : (
            <span className="muted">Not provided</span>
          )}
        </div>
        <div className="card-row">
          <span>Appointments</span>
          <strong>{doctor.appointments}</strong>
        </div>
        <div className="card-row">
          <span>Successes</span>
          <strong>{doctor.successes}</strong>
        </div>
        <div className="card-row">
          <span>Success rate</span>
          <strong>{successRate !== null ? `${successRate}%` : "—"}</strong>
        </div>
        {doctor.lastAppointment && (
          <div className="card-row">
            <span>Last appointment</span>
            <strong>{formatDate(doctor.lastAppointment)}</strong>
          </div>
        )}
      </div>

      {(onAction || footer) && (
        <footer className="card-footer">
          {onAction && (
            <button onClick={onAction} className="card-action" disabled={actionDisabled}>
              {actionLabel}
            </button>
          )}
          {footer}
        </footer>
      )}

      <DoctorProfileModal 
        doctor={doctor}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </article>
  );
}
