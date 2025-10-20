import "./Table.css";
import { formatDate, formatEntityId } from "../../lib/format.js";

export default function AppointmentTable({
  appointments = [],
  doctorLookup = {},
  patientLookup = {},
  onAction,
  actionLabel = "Complete",
  actionDisabledIds = new Set(),
  emptyLabel = "No appointments found."
}) {
  if (!appointments.length) {
    return <div className="table-empty">{emptyLabel}</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Doctor</th>
            <th>Patient</th>
            <th>Schedule</th>
            <th>Status</th>
            {onAction && <th />}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const disabled = actionDisabledIds.has(appt.id) || !appt.open;
            return (
              <tr key={appt.id}>
                <td>#{appt.id}</td>
                <td>
                  <span className="table-strong">
                    {doctorLookup[appt.doctorId]?.name || formatEntityId("DOC", appt.doctorId)}
                  </span>
                  <span className="table-sub">{doctorLookup[appt.doctorId]?.account}</span>
                </td>
                <td>
                  <span className="table-strong">
                    {patientLookup[appt.patientId]?.name || formatEntityId("PAT", appt.patientId)}
                  </span>
                  <span className="table-sub">{patientLookup[appt.patientId]?.account}</span>
                </td>
                <td>{formatDate(appt.startAt)}</td>
                <td>
                  <span className={`status-chip ${appt.open ? "status-success" : "status-muted"}`}>
                    {appt.open ? "Open" : "Completed"}
                  </span>
                </td>
                {onAction && (
                  <td>
                    <button
                      className="table-action"
                      onClick={() => onAction(appt)}
                      disabled={disabled}
                    >
                      {actionLabel}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
