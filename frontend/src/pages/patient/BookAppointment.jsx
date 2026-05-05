import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "../../api/index";
import { useAuth } from "../../context/AuthContext";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
  </svg>
);
const CalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const getNextDays = (n = 14) => {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

// ─── Step indicator ────────────────────────────────────────────────────────────
const StepBar = ({ current }) => {
  const steps = ["Select Date", "Choose Slot", "Confirm"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? "bg-cyan-500 text-slate-900"
                : active ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400"
                : "bg-slate-800 border-2 border-slate-700 text-slate-500"
              }`}>
                {done ? <CheckIcon /> : idx}
              </div>
              <span className={`text-[10px] mt-1 font-medium uppercase tracking-wider ${
                active ? "text-cyan-400" : done ? "text-cyan-500/70" : "text-slate-600"
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 ${done ? "bg-cyan-500/50" : "bg-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const days = getNextDays(14);

  // ── Load doctor details ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await axios.get(`/doctors/${doctorId}`);
        setDoctor(data.doctor || data.data || data);
      } catch {
        setError("Doctor not found.");
      } finally {
        setLoadingDoctor(false);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  // ── Load slots when date selected ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSlots([]);
        setSelectedSlot(null);
        const dateStr = selectedDate.toISOString().split("T")[0];
        const { data } = await axios.get(`/appointments/slots/${doctorId}`, {
          params: { date: dateStr },
        });
        setSlots(data.slots || data.availableSlots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, doctorId]);

  // ── Submit booking ─────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    if (!selectedDate || !selectedSlot) {
      setError("Please select a date and time slot.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await axios.post("/appointments", {
        doctorId,
        appointmentDate: selectedDate.toISOString().split("T")[0],
        slotTime: selectedSlot,
        reason: formData.reason,
        notes: formData.notes,
        type: formData.type || "in-person",
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/40">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Appointment Booked!</h2>
          <p className="text-slate-400 mb-2">
            Your appointment with <span className="text-cyan-400">Dr. {doctor?.name}</span> is confirmed.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            {formatDate(selectedDate)} at {selectedSlot}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/appointments")}
              className="px-6 py-2.5 bg-cyan-500 text-slate-900 font-semibold rounded-xl hover:bg-cyan-400 transition-colors"
            >
              View Appointments
            </button>
            <button
              onClick={() => navigate("/doctors")}
              className="px-6 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl hover:border-cyan-500/50 transition-colors"
            >
              Back to Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 hover:border-cyan-500/50 transition-all"
          >
            <BackIcon />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Book Appointment</h1>
            <p className="text-xs text-slate-400">Complete the steps below</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Doctor summary card */}
        {loadingDoctor ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6 animate-pulse h-28" />
        ) : doctor ? (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6 flex items-center gap-4">
            {doctor.profilePhoto ? (
              <img src={doctor.profilePhoto} alt={doctor.name} className="w-16 h-16 rounded-xl object-cover border-2 border-slate-600" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center border-2 border-slate-600">
                <span className="text-xl font-bold text-cyan-300">
                  {doctor.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white">Dr. {doctor.name}</h2>
              <p className="text-sm text-cyan-400">{doctor.specialty}</p>
              <p className="text-xs text-slate-400 mt-1">{doctor.hospital}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-lg font-bold text-white">₹{doctor.consultationFee}</p>
              <p className="text-xs text-slate-400">Consultation fee</p>
            </div>
          </div>
        ) : null}

        {/* Step bar */}
        <StepBar current={step} />

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP 1: Date picker ──────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <CalIcon /> Select a Date
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {days.map((day) => {
                const isSelected = selectedDate?.toDateString() === day.toDateString();
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-cyan-500 border-cyan-500 text-slate-900"
                        : "bg-slate-800/60 border-slate-700 hover:border-cyan-500/50 text-slate-300"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-medium">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold mt-0.5">{day.getDate()}</p>
                    <p className="text-[10px]">
                      {day.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    {isToday && !isSelected && (
                      <span className="block w-1 h-1 bg-cyan-500 rounded-full mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { if (selectedDate) setStep(2); else setError("Please select a date first."); }}
              disabled={!selectedDate}
              className="mt-6 w-full py-3 bg-cyan-500 text-slate-900 font-semibold rounded-xl disabled:opacity-40 hover:bg-cyan-400 transition-colors"
            >
              Continue to Select Slot →
            </button>
          </div>
        )}

        {/* ── STEP 2: Slot picker ──────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ClockIcon /> Choose a Time Slot
              </h3>
              <p className="text-sm text-cyan-400">{formatDate(selectedDate)}</p>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-slate-300 font-medium">No slots available</p>
                <p className="text-slate-500 text-sm mt-1">Please try a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedSlot === slot
                        ? "bg-cyan-500 border-cyan-500 text-slate-900"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-cyan-500/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep(1); setSelectedSlot(null); }}
                className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl hover:border-cyan-500/30 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => { if (selectedSlot) { setError(""); setStep(3); } else setError("Please select a time slot."); }}
                disabled={!selectedSlot}
                className="flex-1 py-3 bg-cyan-500 text-slate-900 font-semibold rounded-xl disabled:opacity-40 hover:bg-cyan-400 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ──────────────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <h3 className="text-base font-semibold text-white mb-4">Confirm Details</h3>

            {/* Summary */}
            <div className="bg-slate-800/60 border border-cyan-500/20 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Doctor</span>
                <span className="text-white font-medium">Dr. {doctor?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Specialty</span>
                <span className="text-cyan-400">{doctor?.specialty}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Date</span>
                <span className="text-white">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Time</span>
                <span className="text-white font-bold">{selectedSlot}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                <span className="text-slate-400">Consultation Fee</span>
                <span className="text-emerald-400 font-bold">₹{doctor?.consultationFee}</span>
              </div>
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Appointment Type</label>
              <div className="grid grid-cols-2 gap-3">
                {["in-person", "video"].map((type) => (
                  <label key={type} className="relative cursor-pointer">
                    <input type="radio" value={type} defaultChecked={type === "in-person"}
                      {...register("type")} className="peer sr-only" />
                    <div className="p-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-center text-sm font-medium text-slate-300 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-300 transition-all">
                      {type === "in-person" ? "🏥 In-Person" : "📹 Video Call"}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for Visit <span className="text-red-400">*</span>
              </label>
              <input
                {...register("reason", { required: "Please provide a reason for your visit." })}
                placeholder="e.g. Regular check-up, fever, back pain…"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              {errors.reason && (
                <p className="text-red-400 text-xs mt-1">{errors.reason.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional Notes <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Any other details or medical history you'd like the doctor to know…"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl hover:border-cyan-500/30 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-cyan-500 text-slate-900 font-semibold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-700 border-t-slate-900 rounded-full animate-spin" />
                    Booking…
                  </>
                ) : (
                  "Confirm Booking ✓"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;