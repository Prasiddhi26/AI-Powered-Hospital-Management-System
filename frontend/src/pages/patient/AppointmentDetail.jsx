/**
 * AppointmentDetail.jsx — Patient View
 *
 * Shows full details of a single appointment:
 *  - Doctor name, specialization, avatar
 *  - Date, time, appointment type
 *  - Status badge with timeline
 *  - Reason for visit / symptoms
 *  - Prescription (if completed)
 *  - Cancel button (with reason modal) — hidden when completed or already cancelled
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { format, isPast, parseISO } from "date-fns";
import {
  FaArrowLeft,
  FaUserMd,
  FaCalendarAlt,
  FaClock,
  FaStethoscope,
  FaFileAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaHourglassHalf,
  FaRedo,
  FaBan,
  FaExclamationTriangle,
  FaPills,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaClipboardList,
  FaMoneyBillWave,
  FaPrint,
} from "react-icons/fa";
import API from "../../api/index";
//import { appointmentService } from "../../services/api";
import {
  StatusBadge,
  Button,
  Card,
  LoadingSpinner,
} from "../../components/common";

// ─── Status Config ────────────────────────────────────────────────────────────
// Maps each status to an icon, label, colour and descriptive copy.
const STATUS_CONFIG = {
  pending: {
    icon: FaHourglassHalf,
    label: "Pending Confirmation",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    ring: "ring-yellow-400",
    description: "Waiting for the doctor's office to confirm your slot.",
  },
  confirmed: {
    icon: FaCheckCircle,
    label: "Confirmed",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    ring: "ring-blue-400",
    description:
      "Your appointment is confirmed. Please arrive 10 minutes early.",
  },
  completed: {
    icon: FaCheckCircle,
    label: "Completed",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    ring: "ring-green-400",
    description: "Consultation has been completed successfully.",
  },
  cancelled: {
    icon: FaBan,
    label: "Cancelled",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-400",
    description: "This appointment was cancelled.",
  },
  rescheduled: {
    icon: FaRedo,
    label: "Rescheduled",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    ring: "ring-purple-400",
    description: "This appointment has been moved to a new date/time.",
  },
  no_show: {
    icon: FaExclamationTriangle,
    label: "No Show",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    ring: "ring-orange-400",
    description: "Patient did not attend the scheduled appointment.",
  },
};

// ─── Progress Timeline ────────────────────────────────────────────────────────
const TIMELINE_STEPS = ["pending", "confirmed", "completed"];

const StatusTimeline = ({ currentStatus }) => {
  if (["cancelled", "no_show", "rescheduled"].includes(currentStatus))
    return null;

  const activeIndex = TIMELINE_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0 mt-2">
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx <= activeIndex;
        const isLast = idx === TIMELINE_STEPS.length - 1;
        return (
          <React.Fragment key={step}>
            {/* Step dot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isDone
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isDone ? <FaCheckCircle size={13} /> : idx + 1}
              </div>
              <span className="text-[10px] font-medium text-gray-500 capitalize whitespace-nowrap">
                {step}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${
                  idx < activeIndex ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
const CancelModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = ({ reason }) => {
    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      {/* Dialog */}
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-5 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaTimesCircle className="text-red-500 text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Cancel Appointment
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Please let us know why you're cancelling. This helps the doctor's
            office manage their schedule.
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. I have a conflict with work, my symptoms have improved…"
              {...register("reason", {
                required: "Please provide a reason for cancellation.",
                minLength: {
                  value: 10,
                  message: "Reason must be at least 10 characters.",
                },
              })}
              className={`w-full px-4 py-3 border rounded-xl text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-red-500/20 ${
                errors.reason
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 focus:border-red-400"
              }`}
            />
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Warning note */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <FaExclamationTriangle className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Repeated last-minute cancellations may affect your ability to book
              future appointments.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Keep Appointment
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={loading}
              className="flex-1"
            >
              Confirm Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Info Row Helper ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, valueClassName = "" }) => (
  <div className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="text-blue-500 text-sm" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-gray-800 mt-0.5 ${valueClassName}`}
      >
        {value || (
          <span className="text-gray-400 font-normal italic">Not provided</span>
        )}
      </p>
    </div>
  </div>
);

// ─── Prescription Card ────────────────────────────────────────────────────────
const PrescriptionCard = ({ prescription }) => {
  if (!prescription?.medicines?.length && !prescription?.instructions) {
    return null;
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
          <FaPills className="text-white text-base" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Prescription</h3>
          <p className="text-xs text-gray-400">Issued by your doctor</p>
        </div>
      </div>

      {/* Medicines list */}
      {prescription.medicines?.length > 0 && (
        <div className="space-y-2 mb-4">
          {prescription.medicines.map((med, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-green-50/60 border border-green-100 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {med.dosage} · {med.frequency} · {med.duration}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {prescription.instructions && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Doctor's Instructions
          </p>
          <p className="text-sm text-gray-700">{prescription.instructions}</p>
        </div>
      )}

      {/* Follow-up date */}
      {prescription.followUpDate && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <FaCalendarAlt className="text-blue-400" />
          <span>
            Follow-up:{" "}
            <span className="font-semibold">
              {format(new Date(prescription.followUpDate), "MMMM d, yyyy")}
            </span>
          </span>
        </div>
      )}
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ─── Fetch Appointment ────────────────────────────────────────────────────
  const fetchAppointment = useCallback(async () => {
    try {
      const { data } = await API.get(`/appointments/${id}`);
      if (data.success) setAppointment(data.appointment);
    } catch (err) {
      toast.error(err.message || "Failed to load appointment details.");
      navigate("/patient/appointments");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // ─── Cancel Handler ───────────────────────────────────────────────────────
  const handleCancel = async (reason) => {
    setCancelLoading(true);
    try {
      const { data } = await API.put(`/appointments/${id}/status`, {
        status: "cancelled",
        cancelReason: reason,
      });
      if (data.success) {
        toast.success("Appointment cancelled successfully.");
        setAppointment((prev) => ({
          ...prev,
          status: "cancelled",
          cancelReason: reason,
        }));
        setShowCancelModal(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to cancel appointment.");
    } finally {
      setCancelLoading(false);
    }
  };

  // ─── Derived helpers ──────────────────────────────────────────────────────
  const isCancellable =
    appointment &&
    ["pending", "confirmed"].includes(appointment.status) &&
    !isPast(new Date(appointment.appointmentDate));

  const statusCfg = STATUS_CONFIG[appointment?.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const doctor = appointment?.doctor;
  const doctorUser = doctor?.user;

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Fetching appointment details…" />
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* ── Back navigation ───────────────────────────────────────────────── */}
      <button
        onClick={() => navigate("/patient/appointments")}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
      >
        <FaArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Appointments
      </button>
      {/* ── Hero: Status Banner ───────────────────────────────────────────── */}
      <div
        className={`rounded-3xl border-2 ${statusCfg.border} ${statusCfg.bg} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl ${statusCfg.bg} border-2 ${statusCfg.border} flex items-center justify-center flex-shrink-0`}
          >
            <StatusIcon className={`text-2xl ${statusCfg.color}`} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Appointment Status
            </p>
            <h2
              className={`text-2xl font-bold font-display ${statusCfg.color}`}
            >
              {statusCfg.label}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {statusCfg.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors print:hidden"
          >
            <FaPrint />
            Print
          </button>
          {isCancellable && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelModal(true)}
            >
              <FaTimesCircle />
              Cancel
            </Button>
          )}
        </div>
      </div>
      {/* Progress timeline (only for active statuses) */}
      <div className="px-2">
        <StatusTimeline currentStatus={appointment.status} />
      </div>
      {/* ── Doctor Card ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {doctorUser?.avatar ? (
              <img
                src={doctorUser.avatar}
                alt={doctorUser.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {doctorUser?.name?.charAt(0)?.toUpperCase() || "D"}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  Consulting Doctor
                </p>
                <h3 className="text-xl font-bold text-gray-900 font-display mt-0.5">
                  Dr. {doctorUser?.name || "Unknown"}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <FaStethoscope className="text-teal-500 text-xs" />
                  <span className="text-sm text-teal-600 font-medium">
                    {doctor?.specialization}
                  </span>
                </div>
              </div>
              <StatusBadge
                status={appointment.status}
                className="text-sm px-3 py-1"
              />
            </div>

            {/* Doctor meta */}
            <div className="flex flex-wrap gap-4 mt-4">
              {doctorUser?.email && (
                <a
                  href={`mailto:${doctorUser.email}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <FaEnvelope size={11} />
                  {doctorUser.email}
                </a>
              )}
              {doctorUser?.phone && (
                <a
                  href={`tel:${doctorUser.phone}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <FaPhoneAlt size={11} />
                  {doctorUser.phone}
                </a>
              )}
              {doctor?.hospital?.name && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaMapMarkerAlt size={11} />
                  {doctor.hospital.name}
                  {doctor.hospital.city ? `, ${doctor.hospital.city}` : ""}
                </span>
              )}
            </div>

            {/* Qualification */}
            {doctor?.qualification && (
              <p className="mt-2 text-xs text-gray-400">
                {doctor.qualification} · {doctor.experience} yrs experience
              </p>
            )}
          </div>
        </div>
      </Card>
      {/* ── Appointment Details Grid ──────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Date & Time */}
        <Card>
          <h4 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            Schedule
          </h4>
          <p className="text-xs text-gray-400 mb-4">
            Appointment date and time
          </p>

          <div className="space-y-1">
            <InfoRow
              icon={FaCalendarAlt}
              label="Date"
              value={format(
                new Date(appointment.appointmentDate),
                "EEEE, MMMM d, yyyy",
              )}
            />
            <InfoRow
              icon={FaClock}
              label="Time"
              value={
                appointment.slotTime
                  ? `${appointment.slotTime.startTime} – ${appointment.slotTime.endTime}`
                  : "—"
              }
            />
            <InfoRow
              icon={FaMoneyBillWave}
              label="Consultation Fee"
              value={
                appointment.consultationFee != null
                  ? `₹ ${appointment.consultationFee.toLocaleString("en-IN")}`
                  : "—"
              }
            />
          </div>
        </Card>

        {/* Appointment Type & Visit Info */}
        <Card>
          <h4 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <FaClipboardList className="text-blue-500" />
            Visit Info
          </h4>
          <p className="text-xs text-gray-400 mb-4">
            Type and reason for visit
          </p>

          <div className="space-y-1">
            <InfoRow
              icon={FaUserMd}
              label="Appointment Type"
              value={
                appointment.type
                  ? appointment.type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                  : "Consultation"
              }
            />
            <InfoRow
              icon={FaInfoCircle}
              label="Payment Status"
              value={
                appointment.paymentStatus
                  ? appointment.paymentStatus.replace(/\b\w/g, (c) =>
                      c.toUpperCase(),
                    )
                  : "Pending"
              }
              valueClassName={
                appointment.paymentStatus === "paid"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            />
          </div>
        </Card>
      </div>
      // ─── Reason / Symptoms (FIXED)
      ─────────────────────────────────────────────
      <Card>
        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <FaFileAlt className="text-blue-500" />
          Reason for Visit
        </h4>

        <div className="min-h-[80px] p-4 rounded-xl border text-sm leading-relaxed bg-gray-50 border-gray-100 text-gray-700">
          {Array.isArray(appointment.symptoms) &&
          appointment.symptoms.length > 0
            ? appointment.symptoms.join(", ")
            : appointment.reason || "No reason provided."}
        </div>

        {/* Additional notes (FIXED) */}
        {appointment.notes?.patient && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Additional Notes
            </p>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-700 leading-relaxed">
              {appointment.notes.patient}
            </div>
          </div>
        )}

        {/* Doctor notes (optional safe rendering) */}
        {appointment.notes?.doctor && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
              Doctor Notes
            </p>
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-gray-700 leading-relaxed">
              {appointment.notes.doctor}
            </div>
          </div>
        )}

        {/* Cancellation reason */}
        {appointment.status === "cancelled" && appointment.cancelReason && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
              Cancellation Reason
            </p>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 leading-relaxed flex items-start gap-2">
              <FaBan className="mt-0.5 flex-shrink-0" />
              {appointment.cancelReason}
            </div>
          </div>
        )}
      </Card>
      {/* ── Prescription (shown only when completed) ──────────────────────── */}
      {appointment.status === "completed" && (
        <PrescriptionCard prescription={appointment.prescription} />
      )}
      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <FaUserMd size={13} />
          Book Another Appointment
        </Link>

        {isCancellable && (
          <Button
            variant="danger"
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2"
          >
            <FaTimesCircle />
            Cancel This Appointment
          </Button>
        )}
      </div>
      {/* ── Cancel Modal ──────────────────────────────────────────────────── */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        loading={cancelLoading}
      />
    </div>
  );
};

export default AppointmentDetail;
