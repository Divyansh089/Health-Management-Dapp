import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/Home/HomePage.jsx";
import BrowseDoctors from "./pages/Public/BrowseDoctors.jsx";
import BrowseMedicines from "./pages/Public/BrowseMedicines.jsx";
import RegisterDoctor from "./pages/Onboarding/RegisterDoctor.jsx";
import RegisterPatient from "./pages/Onboarding/RegisterPatient.jsx";
import AdminLayout from "./pages/Admin/AdminLayout.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import ManageDoctors from "./pages/Admin/ManageDoctors.jsx";
import ManageMedicines from "./pages/Admin/ManageMedicines.jsx";
import AddMedicine from "./pages/Admin/AddMedicine.jsx";
import AdminActivity from "./pages/Admin/AdminActivity.jsx";
import AdminPatients from "./pages/Admin/AdminPatients.jsx";
import AdminFees from "./pages/Admin/AdminFees.jsx";
import DoctorLayout from "./pages/Doctor/DoctorLayout.jsx";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard.jsx";
import DoctorAppointments from "./pages/Doctor/Appointments.jsx";
import DoctorPrescriptions from "./pages/Doctor/Prescriptions.jsx";
import RequestMedicine from "./pages/Doctor/RequestMedicine.jsx";
import PatientLayout from "./pages/Patient/PatientLayout.jsx";
import PatientDashboard from "./pages/Patient/PatientDashboard.jsx";
import BookAppointment from "./pages/Patient/BookAppointment.jsx";
import MyPrescriptions from "./pages/Patient/MyPrescriptions.jsx";
import RoleGuard from "../components/Guards/RoleGuard.jsx";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/public/doctors" element={<BrowseDoctors />} />
      <Route path="/public/medicines" element={<BrowseMedicines />} />

      <Route path="/onboard/doctor" element={<RegisterDoctor />} />
      <Route path="/onboard/patient" element={<RegisterPatient />} />

      <Route path="/admin" element={<RoleGuard><AdminLayout /></RoleGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<ManageDoctors />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="medicines" element={<ManageMedicines />} />
        <Route path="add-medicine" element={<AddMedicine />} />
        <Route path="fees" element={<AdminFees />} />
        <Route path="activity" element={<AdminActivity />} />
      </Route>

      <Route path="/doctor" element={<RoleGuard><DoctorLayout /></RoleGuard>}>
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<DoctorAppointments />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="request-medicine" element={<RequestMedicine />} />
      </Route>

      <Route path="/patient" element={<RoleGuard><PatientLayout /></RoleGuard>}>
        <Route index element={<PatientDashboard />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="prescriptions" element={<MyPrescriptions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
