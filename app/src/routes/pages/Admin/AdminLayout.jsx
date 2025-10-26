import { Outlet } from "react-router-dom";
import AppShell from "../../../components/Layout/AppShell.jsx";

const SIDEBAR_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/doctors", label: "Doctors", icon: "🩺" },
  { to: "/admin/patients", label: "Patients", icon: "👥" },
  { to: "/admin/medicines", label: "Medicines", icon: "💊" },
  { to: "/admin/medicine-requests", label: "Requests", icon: "📥" },
  { to: "/admin/fees", label: "Update Fees", icon: "💲" },
  { to: "/admin/activity", label: "Activity", icon: "📈" }
];

export default function AdminLayout() {
  return (
    <AppShell sidebarTitle="Admin" sidebarItems={SIDEBAR_ITEMS}>
      <Outlet />
    </AppShell>
  );
}
