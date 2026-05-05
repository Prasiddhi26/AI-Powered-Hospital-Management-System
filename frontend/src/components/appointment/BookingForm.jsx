/**
 * BookingForm.jsx
 * Reusable appointment booking form component.
 * Uses SlotSelector for date/slot picking, React Hook Form for validation.
 *
 * Props:
 *   doctor          {object}   required — doctor data
 *   onSuccess       (appointment) => void
 *   onCancel        () => void
 *   rescheduleId    {string}   optional — existing appointment ID for reschedule
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "../api/index";
import SlotSelector from "./SlotSelector";
import { useToast } from "./ToastProvider";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const DoctorAvatar = ({ doctor }) => {
  const [err, setErr] = useState(false);
  const initials = doctor?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return doctor?.profilePhoto && !err ? (
    <img
      src={doctor.profilePhoto}
      alt={doctor.name}
      onError={() => setErr(true)}
      className="w-12 h-12 rounded-xl object-cover border-2 border-slate-600"
    />
  ) : (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-2 border-slate-600 flex items-center justify-center">
      <span className="text-base font-bold text-cyan-300">{initials}</span>
    </div>
  );
};

// ─── Helper Function ─────────────────────────────
const generateEndTime = (startTime) => {
  const [hour, minute] = startTime.split(":").map(Number);

  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute + 30); // 30 min slot

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${hh}:${mm}`;
};

// ─── Component ─────────────────────────────────────────────────────────────────
const BookingForm = ({ doctor, onSuccess, onCancel, rescheduleId }) => {
  const toast = useToast();
  const isReschedule = Boolean(rescheduleId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type: "in-person",
      reason: "",
      notes: "",
      slot: { date: null, slot: null },
    },
  });

  const slotValue = watch("slot");

  const onSubmit = async (data) => {
    if (!data.slot?.date || !data.slot?.slot) {
      toast.warning("Please select a date and time slot.");
      return;
    }

    try {
      const payload = {
        doctorId: doctor._id,
        appointmentDate: data.slot.date.toISOString().split("T")[0],
        slotTime: {
          startTime: data.slot.slot,
          endTime: generateEndTime(data.slot.slot),
        },
        reason: data.reason,
        notes: data.notes,
        type: data.type,
      };

      let response;
      if (isReschedule) {
        response = await axios.patch(
          `/appointments/${rescheduleId}/reschedule`,
          {
            newDate: payload.appointmentDate,
            newSlotTime: payload.slotTime,
          },
        );
        toast.success("Appointment rescheduled successfully!");
      } else {
        response = await axios.post("/appointments", payload);
        toast.success("Appointment booked successfully!");
      }

      onSuccess?.(response.data?.appointment || response.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Booking failed. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Doctor header */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <DoctorAvatar doctor={doctor} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            Dr. {doctor?.name}
          </p>
          <p className="text-xs text-cyan-400">{doctor?.specialty}</p>
          {doctor?.hospital && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {doctor.hospital}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-white">
            ₹{doctor?.consultationFee}
          </p>
          <p className="text-[10px] text-slate-500">per visit</p>
        </div>
      </div>

      {/* Appointment type */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Appointment Type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: "in-person",
              label: "In-Person",
              icon: "🏥",
              desc: "Visit the clinic",
            },
            {
              value: "video",
              label: "Video Call",
              icon: "📹",
              desc: "Remote consultation",
            },
          ].map((opt) => (
            <label key={opt.value} className="relative cursor-pointer group">
              <input
                type="radio"
                value={opt.value}
                {...register("type")}
                className="peer sr-only"
              />
              <div className="p-3 bg-slate-800/60 border-2 border-slate-700 rounded-xl transition-all peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 group-hover:border-slate-500">
                <p className="text-base mb-1">{opt.icon}</p>
                <p className="text-sm font-semibold text-white peer-checked:text-cyan-300 transition-colors">
                  {opt.label}
                </p>
                <p className="text-[10px] text-slate-500">{opt.desc}</p>
              </div>
              {/* Checkmark */}
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 hidden peer-checked:flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-slate-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Slot selector */}
      <div>
        <Controller
          name="slot"
          control={control}
          rules={{
            validate: (v) =>
              (v?.date && v?.slot) || "Please select a date and time slot.",
          }}
          render={({ field }) => (
            <SlotSelector
              doctorId={doctor?._id}
              value={field.value}
              onChange={field.onChange}
              excludeId={rescheduleId}
            />
          )}
        />
        {errors.slot && (
          <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01"
              />
            </svg>
            {errors.slot.message}
          </p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Reason for Visit <span className="text-red-400 normal-case">*</span>
        </label>
        <input
          {...register("reason", {
            required: "Please enter the reason for your visit.",
            minLength: {
              value: 5,
              message: "Reason must be at least 5 characters.",
            },
            maxLength: {
              value: 200,
              message: "Reason cannot exceed 200 characters.",
            },
          })}
          placeholder="e.g. Regular check-up, chest pain, skin rash…"
          className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
            errors.reason
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
          }`}
        />
        {errors.reason && (
          <p className="text-red-400 text-xs mt-1">{errors.reason.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Additional Notes{" "}
          <span className="text-slate-600 normal-case font-normal">
            (optional)
          </span>
        </label>
        <textarea
          {...register("notes", {
            maxLength: {
              value: 500,
              message: "Notes cannot exceed 500 characters.",
            },
          })}
          rows={3}
          placeholder="Previous diagnoses, current medications, allergies, or anything else the doctor should know…"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
        />
        {errors.notes && (
          <p className="text-red-400 text-xs mt-1">{errors.notes.message}</p>
        )}
      </div>

      {/* Summary preview */}
      {slotValue?.date && slotValue?.slot && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
            Booking Summary
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="text-white font-medium">
                {slotValue.date.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time</span>
              <span className="text-white font-bold">{slotValue.slot}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-500">Fee</span>
              <span className="text-emerald-400 font-bold">
                ₹{doctor?.consultationFee}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-cyan-500 text-slate-900 font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-700 border-t-slate-900 rounded-full animate-spin" />
              {isReschedule ? "Rescheduling…" : "Booking…"}
            </>
          ) : isReschedule ? (
            "Confirm Reschedule"
          ) : (
            "Confirm Booking ✓"
          )}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
