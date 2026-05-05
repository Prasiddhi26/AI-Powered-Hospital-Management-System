import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * ProtectedRoute.jsx
 * Wraps private routes — redirects to /login if not authenticated.
 * Optionally restricts by role: <ProtectedRoute allowedRoles={["admin"]} />
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
 *     <Route path="/admin" element={<AdminPanel />} />
 *   </Route>
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while auth state is resolving (prevents flash of redirect)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login, preserve intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based guard — redirect unauthorized roles to their dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "doctor"
        ? "/doctor/dashboard"
        : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;