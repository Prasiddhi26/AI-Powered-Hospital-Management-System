/**
 * slot.service.js
 * Slot availability checking, double-booking prevention, and reschedule logic
 * Used by: appointment.controller.js
 */

const Appointment = require("../models/Appointment.model");
const Doctor = require("../models/Doctor.model");

// ─── Constants ─────────────────────────────────────────────────────────────────
const SLOT_DURATION_MINUTES = 30; // Each appointment slot is 30 minutes
const MAX_APPOINTMENTS_PER_SLOT = 1; // No double booking

// ─── Helper: Parse time string to minutes since midnight ──────────────────────
/**
 * @param {string} timeStr - "09:30" or "14:00"
 * @returns {number} minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// ─── Helper: Minutes since midnight → "HH:MM" ─────────────────────────────────
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// ─── Helper: Normalize date to start of day (UTC midnight) ────────────────────
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// ─── 1. Get All Available Slots for a Doctor on a Given Date ──────────────────
/**
 * @param {string} doctorId
 * @param {Date|string} date
 * @returns {Promise<string[]>} Array of available slot times e.g. ["09:00","09:30",...]
 */
const getAvailableSlots = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new Error("Doctor not found.");

  const targetDate = normalizeDate(date);
  const dayName = targetDate.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }); // e.g. "Monday"

  // Find working hours for the requested day
  const workingDay = doctor.workingHours?.find(
    (d) => d.day.toLowerCase() === dayName.toLowerCase()
  );

  if (!workingDay || !workingDay.isAvailable) {
    return []; // Doctor not available on this day
  }

  const { startTime, endTime } = workingDay; // e.g. "09:00", "17:00"
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Generate all possible slots
  const allSlots = [];
  for (let t = startMinutes; t + SLOT_DURATION_MINUTES <= endMinutes; t += SLOT_DURATION_MINUTES) {
    allSlots.push(minutesToTime(t));
  }

  // Fetch already-booked appointments for this doctor on this date
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: targetDate, $lt: nextDay },
    status: { $nin: ["cancelled", "rejected"] },
  }).select("slotTime");

  const bookedSlots = new Set(bookedAppointments.map((a) => a.slotTime));

  // Filter out booked slots
  const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

  return availableSlots;
};

// ─── 2. Check if a Specific Slot is Available ─────────────────────────────────
/**
 * @param {string} doctorId
 * @param {Date|string} date
 * @param {string} slotTime - "09:30"
 * @param {string|null} [excludeAppointmentId] - for rescheduling, exclude this appointment
 * @returns {Promise<boolean>}
 */
const isSlotAvailable = async (doctorId, date, slotTime, excludeAppointmentId = null) => {
  const targetDate = normalizeDate(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const query = {
    doctor: doctorId,
    appointmentDate: { $gte: targetDate, $lt: nextDay },
    slotTime,
    status: { $nin: ["cancelled", "rejected"] },
  };

  // Exclude the current appointment when checking for reschedule
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflictingAppointment = await Appointment.findOne(query);
  return !conflictingAppointment; // true = slot is free
};

// ─── 3. Book a Slot (with double-booking prevention) ─────────────────────────
/**
 * Validates slot availability before creating an appointment.
 * Throws if slot is taken.
 * @param {string} doctorId
 * @param {Date|string} date
 * @param {string} slotTime
 * @param {string} patientId
 * @returns {Promise<{doctorId, date, slotTime, patientId}>} validated booking data
 */
const validateAndReserveSlot = async (doctorId, date, slotTime, patientId) => {
  // 1. Check doctor exists and is active
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new Error("Doctor not found.");
  if (!doctor.isActive) throw new Error("This doctor is not currently accepting appointments.");

  // 2. Validate date is not in the past
  const targetDate = normalizeDate(date);
  const today = normalizeDate(new Date());
  if (targetDate < today) throw new Error("Cannot book an appointment for a past date.");

  // 3. Validate slot is within doctor's working hours
  const availableSlots = await getAvailableSlots(doctorId, date);
  if (!availableSlots.includes(slotTime)) {
    throw new Error(
      `Slot ${slotTime} is not available for this doctor on ${new Date(date).toDateString()}. ` +
      `Available slots: ${availableSlots.join(", ") || "None"}`
    );
  }

  // 4. Final double-booking check (atomic guard)
  const available = await isSlotAvailable(doctorId, date, slotTime);
  if (!available) {
    throw new Error(
      `The slot at ${slotTime} on ${new Date(date).toDateString()} has just been booked. Please choose another slot.`
    );
  }

  // 5. Check patient doesn't already have an appointment with same doctor same day
  const targetDateStart = normalizeDate(date);
  const nextDay = new Date(targetDateStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const patientConflict = await Appointment.findOne({
    patient: patientId,
    doctor: doctorId,
    appointmentDate: { $gte: targetDateStart, $lt: nextDay },
    status: { $nin: ["cancelled", "rejected"] },
  });

  if (patientConflict) {
    throw new Error("You already have an appointment with this doctor on this date.");
  }

  return { doctorId, date: targetDateStart, slotTime, patientId };
};

// ─── 4. Reschedule Logic ───────────────────────────────────────────────────────
/**
 * Validates a reschedule request.
 * Checks new slot availability, excluding the current appointment from conflict check.
 * @param {string} appointmentId
 * @param {Date|string} newDate
 * @param {string} newSlotTime
 * @param {string} requestingUserId - patient or doctor making the request
 * @returns {Promise<Appointment>} updated appointment (not saved yet)
 */
const rescheduleAppointment = async (appointmentId, newDate, newSlotTime, requestingUserId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found.");

  // Only pending or confirmed appointments can be rescheduled
  if (!["pending", "confirmed"].includes(appointment.status)) {
    throw new Error(`Cannot reschedule an appointment with status: "${appointment.status}".`);
  }

  // Validate new date is not in the past
  const newTargetDate = normalizeDate(newDate);
  const today = normalizeDate(new Date());
  if (newTargetDate < today) throw new Error("Cannot reschedule to a past date.");

  // Check availability of new slot (exclude current appointment from check)
  const available = await isSlotAvailable(
    appointment.doctor,
    newDate,
    newSlotTime,
    appointmentId
  );

  if (!available) {
    throw new Error(
      `The requested slot ${newSlotTime} on ${new Date(newDate).toDateString()} is not available.`
    );
  }

  // Validate new slot is within doctor's working hours
  const availableSlots = await getAvailableSlots(appointment.doctor, newDate);
  if (!availableSlots.includes(newSlotTime) && newSlotTime !== appointment.slotTime) {
    throw new Error(
      `Slot ${newSlotTime} is outside the doctor's available hours. ` +
      `Available: ${availableSlots.join(", ") || "None"}`
    );
  }

  // Apply changes (caller must save)
  appointment.appointmentDate = newTargetDate;
  appointment.slotTime = newSlotTime;
  appointment.status = "pending"; // Reset to pending after reschedule
  appointment.rescheduleHistory = [
    ...(appointment.rescheduleHistory || []),
    {
      rescheduledBy: requestingUserId,
      rescheduledAt: new Date(),
      previousDate: appointment.appointmentDate,
      previousSlot: appointment.slotTime,
    },
  ];

  return appointment; // Caller does: await appointment.save()
};

// ─── 5. Get Booked Slots for a Doctor (for calendar display) ─────────────────
/**
 * @param {string} doctorId
 * @param {Date|string} date
 * @returns {Promise<string[]>} booked slot times
 */
const getBookedSlots = async (doctorId, date) => {
  const targetDate = normalizeDate(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const booked = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: targetDate, $lt: nextDay },
    status: { $nin: ["cancelled", "rejected"] },
  }).select("slotTime");

  return booked.map((a) => a.slotTime);
};

// ─── 6. Get Slots for a Date Range (week/month view) ─────────────────────────
/**
 * @param {string} doctorId
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {Promise<Object>} { "2024-01-15": ["09:00","10:00"], ... }
 */
const getSlotsByDateRange = async (doctorId, startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const result = {};

  const current = new Date(start);
  while (current <= end) {
    const dateKey = current.toISOString().split("T")[0]; // "YYYY-MM-DD"
    result[dateKey] = await getAvailableSlots(doctorId, new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};

module.exports = {
  getAvailableSlots,
  isSlotAvailable,
  validateAndReserveSlot,
  rescheduleAppointment,
  getBookedSlots,
  getSlotsByDateRange,
  timeToMinutes,
  minutesToTime,
  normalizeDate,
  SLOT_DURATION_MINUTES,
};