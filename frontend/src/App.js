import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Patient Pages
import PatientDashboard from "./pages/patient/Dashboard";
import FindDoctors from "./pages/patient/FindDoctors";
import DoctorProfile from "./pages/patient/DoctorProfile";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import AppointmentDetail from "./pages/patient/AppointmentDetail";
import SymptomChecker from "./pages/patient/SymptomChecker";
import MyReports from "./pages/patient/MyReports";
import Profile from "./pages/patient/Profile";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorAppointments from "./pages/doctor/Appointments";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";

// Loading screen
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 font-sans text-sm tracking-wide">Loading MediFlow...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

// Public route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Default redirect */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Public Auth Routes */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Patient Routes */}
    <Route path="/patient" element={<ProtectedRoute allowedRoles={["patient"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<PatientDashboard />} />
      <Route path="doctors" element={<FindDoctors />} />
      <Route path="doctors/:id" element={<DoctorProfile />} />
      <Route path="book/:doctorId" element={<BookAppointment />} />
      <Route path="appointments" element={<MyAppointments />} />
      <Route path="appointments/:id" element={<AppointmentDetail />} />
      <Route path="symptom-checker" element={<SymptomChecker />} />
      <Route path="reports" element={<MyReports />} />
      <Route path="profile" element={<Profile />} />
    </Route>

    {/* Doctor Routes */}
    <Route path="/doctor" element={<ProtectedRoute allowedRoles={["doctor"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<DoctorDashboard />} />
      <Route path="appointments" element={<DoctorAppointments />} />
      <Route path="appointments/:id" element={<AppointmentDetail />} />
      <Route path="profile" element={<Profile />} />
    </Route>

    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<AdminDashboard />} />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
          toastClassName="!bg-slate-800 !text-slate-100 !border !border-slate-700"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;