import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiCheckCircle, FiUsers, FiArrowRight, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { appointmentAPI, doctorAPI } from "../../api";
import { StatCard, LoadingSpinner, EmptyState, Card, Button, StatusBadge, Avatar } from "../../components/common";
import { toast } from "react-toastify";
import { format } from "date-fns";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, completed: 0 });
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aptRes] = await Promise.all([
        appointmentAPI.getAll({ limit: 5, page: 1 }),
      ]);

      const apts = aptRes.data.appointments || [];
      setAppointments(apts);

      const today = new Date().toDateString();
      const todayCount = apts.filter((a) => new Date(a.appointmentDate).toDateString() === today).length;
      const pending = apts.filter((a) => a.status === "pending").length;
      const completed = apts.filter((a) => a.status === "completed").length;

      setStats({ total: aptRes.data.total || 0, today: todayCount, pending, completed });
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!doctorProfile) return;
    setTogglingAvailability(true);
    try {
      await doctorAPI.updateProfile({ isAcceptingAppointments: !doctorProfile.isAcceptingAppointments });
      setDoctorProfile((prev) => ({ ...prev, isAcceptingAppointments: !prev.isAcceptingAppointments }));
      toast.success(doctorProfile.isAcceptingAppointments
        ? "You are now offline"
        : "You are now accepting appointments");
    } catch {
      toast.error("Failed to update availability");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await appointmentAPI.updateStatus(id, { status: "confirmed" });
      toast.success("Appointment confirmed");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl lg:text-3xl">
            Welcome, Dr. {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your practice overview</p>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={toggleAvailability}
          disabled={togglingAvailability}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
            ${doctorProfile?.isAcceptingAppointments !== false
              ? "bg-teal-500/20 border-teal-500/40 text-teal-400 hover:bg-teal-500/30"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
        >
          {doctorProfile?.isAcceptingAppointments !== false
            ? <><FiToggleRight className="text-lg" /> Accepting Appointments</>
            : <><FiToggleLeft className="text-lg" /> Not Available</>
          }
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiCalendar} label="Total Appointments" value={stats.total} color="teal" />
        <StatCard icon={FiClock} label="Today's Appointments" value={stats.today} color="blue" />
        <StatCard icon={FiUsers} label="Pending Review" value={stats.pending} color="amber" />
        <StatCard icon={FiCheckCircle} label="Completed" value={stats.completed} color="purple" />
      </div>

      {/* Recent Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-display font-semibold text-lg">Recent Appointments</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/doctor/appointments")}>
            View all <FiArrowRight />
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No appointments yet"
            description="Your upcoming appointments will appear here"
          />
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <Card key={apt._id} className="p-4 hover:border-slate-700 transition-all cursor-pointer" hover>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={apt.patient?.avatar} name={apt.patient?.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{apt.patient?.name}</p>
                      <p className="text-slate-400 text-xs truncate">{apt.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-white text-xs font-medium">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), "MMM dd") : "—"}
                      </p>
                      <p className="text-slate-400 text-xs">{apt.slotTime?.startTime}</p>
                    </div>
                    <StatusBadge status={apt.status} />
                    {apt.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleConfirm(apt._id)}>
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <Card className="p-5 bg-gradient-to-r from-blue-500/5 to-teal-500/5 border-blue-500/20">
        <h3 className="text-white font-semibold mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span> Set your available time slots in your profile to let patients book efficiently.</li>
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span> Confirm pending appointments promptly to avoid cancellations.</li>
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span> Add prescriptions after consultations so patients can access them digitally.</li>
        </ul>
      </Card>
    </div>
  );
};

export default DoctorDashboard;