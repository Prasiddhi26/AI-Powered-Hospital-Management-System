import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiSearch, FiActivity, FiFileText, FiArrowRight, FiClock } from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import { appointmentAPI } from "../../api";
import { StatCard, LoadingSpinner, EmptyState, Card, Button } from "../../components/common";
import AppointmentCard from "../../components/appointment/AppointmentCard";
import { toast } from "react-toastify";

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await appointmentAPI.getAll({ limit: 3 });
      setAppointments(data.appointments || []);

      const upcoming = data.appointments?.filter((a) => ["pending", "confirmed"].includes(a.status)).length || 0;
      const completed = data.appointments?.filter((a) => a.status === "completed").length || 0;
      setStats({ total: data.total || 0, upcoming, completed });
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentAPI.cancel(id, { reason: "Cancelled by patient" });
      toast.success("Appointment cancelled");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  const quickActions = [
    { label: "Find a Doctor", desc: "Browse verified specialists", icon: FiSearch, path: "/patient/doctors", color: "from-teal-500 to-teal-600", iconBg: "bg-teal-500/20" },
    { label: "AI Symptom Check", desc: "Describe your symptoms", icon: RiRobot2Line, path: "/patient/symptom-checker", color: "from-purple-500 to-pink-500", iconBg: "bg-purple-500/20", badge: "AI" },
    { label: "My Reports", desc: "Upload & view medical files", icon: FiFileText, path: "/patient/reports", color: "from-blue-500 to-blue-600", iconBg: "bg-blue-500/20" },
    { label: "All Appointments", desc: "View your history", icon: FiCalendar, path: "/patient/appointments", color: "from-amber-500 to-amber-600", iconBg: "bg-amber-500/20" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display font-bold text-white text-2xl lg:text-3xl">
          Good morning, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening with your health today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiCalendar} label="Total Appointments" value={stats.total} color="teal" />
        <StatCard icon={FiClock} label="Upcoming" value={stats.upcoming} color="blue" />
        <StatCard icon={FiActivity} label="Completed" value={stats.completed} color="purple" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-white font-display font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ label, desc, icon: Icon, path, iconBg, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg group"
            >
              <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="text-white text-xl" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  {badge && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-md font-bold">
                      {badge}
                    </span>
                  )}
                  <FiArrowRight className="text-slate-600 group-hover:text-teal-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-display font-semibold text-lg">Recent Appointments</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/patient/appointments")}>
            View all <FiArrowRight />
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No appointments yet"
            description="Book your first appointment with a verified doctor"
            action={
              <Button variant="primary" onClick={() => navigate("/patient/doctors")}>
                Find Doctors <FiArrowRight />
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {appointments.map((apt) => (
              <AppointmentCard key={apt._id} appointment={apt} onCancel={handleCancelAppointment} />
            ))}
          </div>
        )}
      </div>

      {/* Health Tip Banner */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-teal-400 font-semibold text-sm mb-1">💡 AI Health Tip</p>
          <p className="text-white font-display font-bold text-lg">Feeling unwell?</p>
          <p className="text-slate-400 text-sm mt-1">Use our AI Symptom Checker to get instant insights and specialist recommendations.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/patient/symptom-checker")} className="flex-shrink-0 ml-4">
          Try Now <RiRobot2Line />
        </Button>
      </div>
    </div>
  );
};

export default PatientDashboard;