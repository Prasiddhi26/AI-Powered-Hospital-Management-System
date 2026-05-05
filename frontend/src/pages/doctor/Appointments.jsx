import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiCheckCircle, FiXCircle, FiEye, FiSearch } from "react-icons/fi";
import { appointmentAPI } from "../../api";
import { LoadingSpinner, EmptyState, Button, Avatar, Card, StatusBadge } from "../../components/common";
import { toast } from "react-toastify";
import { format } from "date-fns";

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentAPI.getAll({
        page, limit: 10,
        ...(activeTab && { status: activeTab }),
      });
      setAppointments(data.appointments || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-white text-2xl lg:text-3xl">Appointments</h1>
        <p className="text-slate-400 text-sm mt-1">{total} total appointments</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPage(1); }}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0
              ${activeTab === key ? "bg-slate-800 text-white" : "text-slate-500 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table / List */}
      {loading ? (
        <LoadingSpinner text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState icon={FiCalendar} title="No appointments found" description="Appointments will appear here once patients book with you" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Patient</th>
                  <th className="text-left px-5 py-3">Date & Time</th>
                  <th className="text-left px-5 py-3">Reason</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={apt.patient?.avatar} name={apt.patient?.name} size="sm" />
                        <div>
                          <p className="text-white text-sm font-medium">{apt.patient?.name}</p>
                          <p className="text-slate-500 text-xs">{apt.patient?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), "MMM dd, yyyy") : "—"}
                      </p>
                      <p className="text-slate-400 text-xs">{apt.slotTime?.startTime} – {apt.slotTime?.endTime}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-300 text-sm max-w-xs truncate">{apt.reason}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-300 text-sm capitalize">{apt.type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/doctor/appointments/${apt._id}`)}
                          className="text-slate-400 hover:text-teal-400 transition-colors"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        {apt.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(apt._id, "confirmed")}
                              className="text-slate-400 hover:text-teal-400 transition-colors"
                              title="Confirm"
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt._id, "cancelled")}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <FiXCircle />
                            </button>
                          </>
                        )}
                        {apt.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusChange(apt._id, "completed")}
                            className="text-slate-400 hover:text-teal-400 transition-colors"
                            title="Mark Complete"
                          >
                            <FiCheckCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {appointments.map((apt) => (
              <Card key={apt._id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={apt.patient?.avatar} name={apt.patient?.name} size="sm" />
                    <div>
                      <p className="text-white text-sm font-medium">{apt.patient?.name}</p>
                      <p className="text-slate-500 text-xs">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), "MMM dd") : "—"} at {apt.slotTime?.startTime}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
                <p className="text-slate-400 text-xs mb-3 line-clamp-2">{apt.reason}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/doctor/appointments/${apt._id}`)}>
                    <FiEye /> View
                  </Button>
                  {apt.status === "pending" && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(apt._id, "confirmed")}>
                      <FiCheckCircle /> Confirm
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-slate-400 text-sm px-3">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorAppointments;