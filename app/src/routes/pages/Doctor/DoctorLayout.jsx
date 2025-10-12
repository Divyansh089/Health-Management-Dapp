import { Outlet } from "react-router-dom";
import AppShell from "../../../components/Layout/AppShell.jsx";

const SIDEBAR_ITEMS = [
  { to: "/doctor", label: "Dashboard", icon: "📊" },
  { to: "/doctor/patients", label: "Patients", icon: "👥" },
  { to: "/doctor/prescriptions", label: "Prescriptions", icon: "📝" }
];

export default function DoctorLayout() {
  return (
    <AppShell sidebarTitle="Doctor" sidebarItems={SIDEBAR_ITEMS}>
      <Outlet />
    </AppShell>
  );
}
