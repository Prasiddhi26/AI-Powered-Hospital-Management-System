/**
 * SlotSelector.jsx
 * Reusable date + time-slot picker for appointment booking.
 * Fetches available slots from API on date change.
 *
 * Props:
 *   doctorId        {string}   required
 *   value           {{ date: Date|null, slot: string|null }}
 *   onChange        (value) => void
 *   excludeId       {string}   optional — appointment to exclude (reschedule)
 *   daysAhead       {number}   default 14
 *   disabled        {boolean}
 */

import { useState, useEffect } from "react";
import axios from "../api/index";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
  </svg>
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const buildDays = (count) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

const toISO = (d) => d.toISOString().split("T")[0];

const groupSlots = (slots) => {
  const groups = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach((s) => {
    const h = parseInt(s.split(":")[0], 10);
    if (h < 12) groups.Morning.push(s);
    else if (h < 17) groups.Afternoon.push(s);
    else groups.Evening.push(s);
  });
  return groups;
};

const SESSION_ICONS = { Morning: "🌅", Afternoon: "☀️", Evening: "🌆" };

// ─── Component ─────────────────────────────────────────────────────────────────
const SlotSelector = ({
  doctorId,
  value = { date: null, slot: null },
  onChange,
  excludeId,
  daysAhead = 14,
  disabled = false,
}) => {
  const [days] = useState(() => buildDays(daysAhead));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startIdx, setStartIdx] = useState(0);
  const VISIBLE = 7;

  const visibleDays = days.slice(startIdx, startIdx + VISIBLE);

  // Fetch slots on date change
  useEffect(() => {
    if (!value.date || !doctorId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        setError("");
        setSlots([]);
        const params = { date: toISO(value.date) };
        if (excludeId) params.excludeId = excludeId;
        const { data } = await axios.get(`/appointments/slots/${doctorId}`, { params });
        setSlots(data.slots || data.availableSlots || []);
      } catch {
        setError("Could not load slots. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [value.date, doctorId, excludeId]);

  const selectDate = (day) => {
    if (disabled) return;
    onChange({ date: day, slot: null });
  };

  const selectSlot = (slot) => {
    if (disabled) return;
    onChange({ ...value, slot });
  };

  const grouped = groupSlots(slots);

  return (
    <div className="space-y-5">
      {/* ── Date strip ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Select Date
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStartIdx((i) => Math.max(0, i - VISIBLE))}
              disabled={startIdx === 0}
              className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-all"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => setStartIdx((i) => Math.min(days.length - VISIBLE, i + VISIBLE))}
              disabled={startIdx + VISIBLE >= days.length}
              className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-all"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {visibleDays.map((day) => {
            const isSelected = value.date?.toDateString() === day.toDateString();
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <button
                key={toISO(day)}
                type="button"
                onClick={() => selectDate(day)}
                disabled={disabled}
                className={`relative flex flex-col items-center py-2.5 px-1 rounded-xl border text-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? "bg-cyan-500 border-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-700/60"
                }`}
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
                  {DAYS_SHORT[day.getDay()]}
                </span>
                <span className="text-base font-bold mt-0.5">{day.getDate()}</span>
                <span className="text-[9px] opacity-60">{MONTHS_SHORT[day.getMonth()]}</span>
                {isToday && !isSelected && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Slot grid ──────────────────────────────────────────────────────── */}
      {value.date && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ClockIcon />
            Available Slots —{" "}
            {value.date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </p>

          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          ) : slots.length === 0 ? (
            <div className="py-10 text-center bg-slate-800/40 rounded-xl border border-slate-700">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-slate-400 text-sm font-medium">No slots available</p>
              <p className="text-slate-600 text-xs mt-1">Try a different date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([session, sessionSlots]) => {
                if (!sessionSlots.length) return null;
                return (
                  <div key={session}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                      {SESSION_ICONS[session]} {session}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {sessionSlots.map((slot) => {
                        const isSelected = value.slot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => selectSlot(slot)}
                            disabled={disabled}
                            className={`py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-40 ${
                              isSelected
                                ? "bg-cyan-500 border-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-700"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlotSelector;