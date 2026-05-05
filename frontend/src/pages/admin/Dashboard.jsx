import React, { useState, useEffect } from "react";
import { FiUsers, FiUserCheck, FiCalendar, FiAlertCircle, FiCheckCircle, FiXCircle, FiShield } from "react-icons/fi";
import { adminAPI } from "../../api";
import { StatCard, LoadingSpinner, EmptyState, Card, Button, Avatar, StatusBadge } from "../../components/common";
import { toast } from "react-toastify";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingDoctors(),
        adminAPI.getUsers({ limit: 10 }),
      ]);
      setStats(statsRes.data.stats);
      setRecentAppointments(statsRes.data.recentAppointments || []);
      setPendingDoctors(pendingRes.data.doctors || []);
      setAllUsers(usersRes.data.users || []);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (id, isVerified) => {
    try {
      await adminAPI.verifyDoctor(id, { isVerified });
      toast.success(`Doctor ${isVerified ? "verified" : "unverified"} successfully`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success("User status updated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "doctors", label: `Pending Doctors ${pendingDoctors.length > 0 ? `(${pendingDoctors.length})` : ""}` },
    { key: "users", label: "Users" },
  ];

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/40 rounded-xl flex items-center justify-center">
            <FiShield className="text-purple-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-2xl">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">MediFlow platform overview</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiUsers} label="Total Patients" value={stats.totalPatients} color="blue" />
          <StatCard icon={FiUserCheck} label="Verified Doctors" value={stats.totalDoctors} color="teal" />
          <StatCard icon={FiCalendar} label="Total Appointments" value={stats.totalAppointments} color="purple" />
          <StatCard icon={FiAlertCircle} label="Pending Verifications" value={stats.pendingDoctorVerifications} color="amber" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0
              ${activeTab === key ? "bg-slate-800 text-white" : "text-slate-500 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-white font-semibold">Recent Appointments</h2>
          {recentAppointments.length === 0 ? (
            <EmptyState icon={FiCalendar} title="No appointments" description="No appointments yet on the platform" />
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Patient</th>
                    <th className="text-left px-5 py-3">Doctor</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt) => (
                    <tr key={apt._id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-white text-sm">{apt.patient?.name}</td>
                      <td className="px-5 py-3 text-slate-300 text-sm">Dr. {apt.doctor?.user?.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-sm">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), "MMM dd, yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={apt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Pending Doctors Tab */}
      {activeTab === "doctors" && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-white font-semibold">Doctor Verification Requests</h2>
          {pendingDoctors.length === 0 ? (
            <EmptyState
              icon={FiCheckCircle}
              title="All caught up!"
              description="No pending doctor verification requests"
            />
          ) : (
            <div className="space-y-3">
              {pendingDoctors.map((doc) => (
                <Card key={doc._id} className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <Avatar src={doc.user?.avatar} name={doc.user?.name} size="md" />
                      <div>
                        <p className="text-white font-semibold">Dr. {doc.user?.name}</p>
                        <p className="text-teal-400 text-sm">{doc.specialization}</p>
                        <p className="text-slate-400 text-xs">{doc.qualification} · {doc.experience} yrs · License: {doc.licenseNumber}</p>
                        <p className="text-slate-500 text-xs">{doc.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerifyDoctor(doc._id, true)}
                      >
                        <FiCheckCircle /> Verify
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleVerifyDoctor(doc._id, false)}
                      >
                        <FiXCircle /> Reject
                      </Button>
                    </div>
                  </div>
                  {doc.hospital && (
                    <p className="text-slate-500 text-xs mt-3 pt-3 border-t border-slate-800">
                      Hospital: {doc.hospital}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-white font-semibold">Platform Users</h2>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Joined</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u._id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <div>
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
                        ${u.role === "admin"
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          : u.role === "doctor"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-teal-500/20 text-teal-400 border-teal-500/30"
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">
                      {u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${u.isActive ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleToggleUser(u._id)}
                          className={`text-xs font-medium transition-colors ${u.isActive ? "text-red-400 hover:text-red-300" : "text-teal-400 hover:text-teal-300"}`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;