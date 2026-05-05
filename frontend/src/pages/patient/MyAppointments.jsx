import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/index";
import { useAuth } from "../../context/AuthContext";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400 animate-pulse" },
  completed: { label: "Completed", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",    dot: "bg-blue-400" },
  cancelled: { label: "Cancelled", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      dot: "bg-red-400" },
  rejected:  { label: "Rejected",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      dot: "bg-red-400" },
  rescheduled:{ label: "Rescheduled",color:"text-purple-400",bg:"bg-purple-500/10 border-purple-500/30",  dot: "bg-purple-400" },
};

const FILTER_TABS = ["all", "pending", "confirmed", "completed", "cancelled"];

// ─── Icons ─────────────────────────────────────────────────────────────────────
const CalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/>
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/>
  </svg>
);

// ─── Format date ───────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

const isUpcoming = (date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0));

// ─── Cancel Modal ──────────────────────────────────────────────────────────────
const CancelModal = ({ appointment, onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <XIcon />
      </div>
      <h3 className="text-lg font-bold text-white text-center mb-2">Cancel Appointment?</h3>
      <p className="text-slate-400 text-sm text-center mb-1">
        Dr. {appointment?.doctor?.name}
      </p>
      <p className="text-slate-500 text-xs text-center mb-6">
        {formatDate(appointment?.appointmentDate)} at {appointment?.slotTime}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm hover:border-slate-500 transition-colors"
        >
          Keep it
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling…" : "Yes, Cancel"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Appointment Card ──────────────────────────────────────────────────────────
const AppointmentCard = ({ appt, onCancel, onReschedule }) => {
  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const upcoming = isUpcoming(appt.appointmentDate);
  const canCancel = ["pending", "confirmed"].includes(appt.status) && upcoming;
  const canReschedule = ["pending", "confirmed"].includes(appt.status) && upcoming;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-slate-800/60 border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
      upcoming && appt.status === "confirmed"
        ? "border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-emerald-500/5"
        : "border-slate-700/50 hover:border-slate-600"
    }`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Doctor avatar */}
          <div className="flex-shrink-0">
            {appt.doctor?.profilePhoto ? (
              <img src={appt.doctor.profilePhoto} alt={appt.doctor.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-slate-600" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-2 border-slate-600 flex items-center justify-center">
                <span className="text-sm font-bold text-cyan-300">
                  {appt.doctor?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
                </span>
              </div>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  Dr. {appt.doctor?.name || "Unknown"}
                </h3>
                <p className="text-xs text-cyan-400 truncate">{appt.doctor?.specialty || "Specialist"}</p>
              </div>
              {/* Status badge */}
              <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${status.bg} ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>

            {/* Date & time */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CalIcon />
                {formatDate(appt.appointmentDate)}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon />
                {appt.slotTime}
              </span>
              {appt.type && (
                <span className="px-2 py-0.5 bg-slate-700/50 rounded-lg capitalize">
                  {appt.type === "video" ? "📹 Video" : "🏥 In-Person"}
                </span>
              )}
            </div>

            {/* Reason preview */}
            {appt.reason && (
              <p className="text-xs text-slate-500 mt-2 truncate">
                <span className="text-slate-600">Reason: </span>{appt.reason}
              </p>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2 text-sm">
            {appt.notes && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-slate-300 text-xs">{appt.notes}</p>
              </div>
            )}
            {appt.doctor?.hospital && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Hospital</span>
                <span className="text-slate-300 text-xs">{appt.doctor.hospital}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Consultation Fee</span>
              <span className="text-emerald-400 text-xs font-semibold">₹{appt.doctor?.consultationFee || "N/A"}</span>
            </div>
            {appt.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Booked On</span>
                <span className="text-slate-400 text-xs">{formatDate(appt.createdAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
          >
            {expanded ? "Show Less ↑" : "Show More ↓"}
          </button>
          {canReschedule && (
            <button
              onClick={() => onReschedule(appt)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:bg-purple-500/20 transition-all"
            >
              <RefreshIcon /> Reschedule
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(appt)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-all"
            >
              <XIcon /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 animate-pulse">
    <div className="flex gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-700 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-1/3 mb-3" />
        <div className="h-3 bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const MyAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: LIMIT,
        ...(activeTab !== "all" && { status: activeTab }),
      };
      const { data } = await axios.get("/appointments/my", { params });
      setAppointments(data.appointments || data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await axios.patch(`/appointments/${cancelTarget._id}/cancel`);
      setAppointments((prev) =>
        prev.map((a) => a._id === cancelTarget._id ? { ...a, status: "cancelled" } : a)
      );
      setCancelTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = (appt) => {
    navigate(`/book-appointment/${appt.doctor._id}?reschedule=${appt._id}`);
  };

  // Counters for tab badges
  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">My Appointments</h1>
              <p className="text-xs text-slate-400 mt-0.5">Track and manage your visits</p>
            </div>
            <button
              onClick={() => navigate("/doctors")}
              className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-colors"
            >
              + Book New
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeTab === tab
                    ? "bg-cyan-500 text-slate-900"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500"
                }`}
              >
                {tab}
                {tab !== "all" && counts[tab] ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    activeTab === tab ? "bg-slate-900/30 text-slate-900" : "bg-slate-700 text-slate-300"
                  }`}>
                    {counts[tab]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <span>⚠️ {error}</span>
            <button onClick={fetchAppointments} className="ml-auto px-3 py-1 bg-red-500/20 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-300 font-medium text-lg">No appointments found</p>
            <p className="text-slate-500 text-sm mt-2">
              {activeTab !== "all"
                ? `You have no ${activeTab} appointments.`
                : "Book your first appointment with a doctor."}
            </p>
            <button
              onClick={() => navigate("/doctors")}
              className="mt-5 px-6 py-2.5 bg-cyan-500 text-slate-900 font-semibold rounded-xl hover:bg-cyan-400 transition-colors"
            >
              Find a Doctor
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming separator */}
            {activeTab === "all" && (
              <>
                {appointments.some((a) => isUpcoming(a.appointmentDate) && !["cancelled","rejected","completed"].includes(a.status)) && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                      Upcoming
                    </p>
                    <div className="space-y-3">
                      {appointments
                        .filter((a) => isUpcoming(a.appointmentDate) && !["cancelled","rejected","completed"].includes(a.status))
                        .map((appt) => (
                          <AppointmentCard
                            key={appt._id}
                            appt={appt}
                            onCancel={setCancelTarget}
                            onReschedule={handleReschedule}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {appointments.some((a) => !isUpcoming(a.appointmentDate) || ["cancelled","rejected","completed"].includes(a.status)) && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Past</p>
                    <div className="space-y-3">
                      {appointments
                        .filter((a) => !isUpcoming(a.appointmentDate) || ["cancelled","rejected","completed"].includes(a.status))
                        .map((appt) => (
                          <AppointmentCard
                            key={appt._id}
                            appt={appt}
                            onCancel={setCancelTarget}
                            onReschedule={handleReschedule}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab !== "all" && (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <AppointmentCard
                    key={appt._id}
                    appt={appt}
                    onCancel={setCancelTarget}
                    onReschedule={handleReschedule}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:border-cyan-500/50 transition-all"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:border-cyan-500/50 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}
    </div>
  );
};

export default MyAppointments;