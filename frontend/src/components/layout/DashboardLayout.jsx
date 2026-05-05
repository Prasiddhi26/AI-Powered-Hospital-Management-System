import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiHome, FiSearch, FiCalendar, FiActivity, FiFileText,
  FiUser, FiLogOut, FiBell, FiMenu, FiX, FiShield, FiUsers,
} from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";

// Navigation config per role
const navConfig = {
  patient: [
    { label: "Dashboard", icon: FiHome, path: "/patient/dashboard" },
    { label: "Find Doctors", icon: FiSearch, path: "/patient/doctors" },
    { label: "My Appointments", icon: FiCalendar, path: "/patient/appointments" },
    { label: "AI Symptom Check", icon: RiRobot2Line, path: "/patient/symptom-checker", highlight: true },
    { label: "My Reports", icon: FiFileText, path: "/patient/reports" },
    { label: "Profile", icon: FiUser, path: "/patient/profile" },
  ],
  doctor: [
    { label: "Dashboard", icon: FiHome, path: "/doctor/dashboard" },
    { label: "Appointments", icon: FiCalendar, path: "/doctor/appointments" },
    { label: "Profile", icon: FiUser, path: "/doctor/profile" },
  ],
  admin: [
    { label: "Dashboard", icon: FiHome, path: "/admin/dashboard" },
    { label: "Users", icon: FiUsers, path: "/admin/users" },
    { label: "Doctors", icon: FiShield, path: "/admin/doctors" },
  ],
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
            <FiActivity className="text-white text-lg" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-xl">Medi</span>
            <span className="font-display font-bold text-teal-400 text-xl">Flow</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-800/60 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, path, highlight }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? "bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-400 border border-teal-500/30"
                : highlight
                  ? "text-slate-300 hover:bg-purple-500/10 hover:text-purple-300 border border-transparent hover:border-purple-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
              }`
            }
          >
            <Icon className="text-lg flex-shrink-0" />
            <span>{label}</span>
            {highlight && (
              <span className="ml-auto text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium">
                AI
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <FiLogOut className="text-lg" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <FiMenu className="text-xl" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-slate-200 font-display font-semibold text-lg">
              {navItems.find((n) => window.location.pathname.startsWith(n.path))?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => navigate(`/${user?.role}/dashboard`)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <FiBell className="text-xl" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;