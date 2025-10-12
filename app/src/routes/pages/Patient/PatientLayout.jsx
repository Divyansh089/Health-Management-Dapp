import { Outlet } from "react-router-dom";
import AppShell from "../../../components/Layout/AppShell.jsx";

const SIDEBAR_ITEMS = [
  { to: "/patient", label: "Dashboard", icon: "📊" },
  { to: "/patient/book", label: "Book Appointment", icon: "📅" },
  { to: "/patient/prescriptions", label: "Prescriptions", icon: "💊" }
];

export default function PatientLayout() {
  return (
    <AppShell sidebarTitle="Patient" sidebarItems={SIDEBAR_ITEMS}>
      <Outlet />
    </AppShell>
  );
}
