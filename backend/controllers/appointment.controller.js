//const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment.model");
const Doctor = require("../models/Doctor.model");
const Notification = require("../models/Notification.model");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments
 * @access  Private (Patient)
 */

const bookAppointment = asyncHandler(async (req, res) => {
  console.log("REQ BODY:", req.body);
  const {
    doctorId,
    appointmentDate,
    slotTime,
    reason,
    type,
    symptoms,
    notes,
  } = req.body;

  // ─── Normalize slotTime ─────────────────────────────
  const startTime =
    typeof slotTime === "object" ? slotTime?.startTime : slotTime;

  const endTime =
    typeof slotTime === "object" ? slotTime?.endTime : null;

  if (!startTime) {
    res.status(400);
    throw new Error("slotTime.startTime is required");
  }

  const generateEndTime = (start) => {
    const [h, m] = start.split(":").map(Number);
    const d = new Date();
    d.setHours(h);
    d.setMinutes(m + 30);
    return d.toTimeString().slice(0, 5);
  };

  // ─── Validate doctor ─────────────────────────────
  const doctor = await Doctor.findById(doctorId).populate("user", "name");

  if (!doctor || !doctor.isVerified) {
    res.status(404);
    throw new Error("Doctor not found or not verified");
  }

  if (!doctor.isAcceptingAppointments) {
    res.status(400);
    throw new Error("This doctor is not accepting appointments currently");
  }

  // ─── Check slot availability ─────────────────────────────
  const existingBooking = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),
    "slotTime.startTime": startTime,
    status: { $nin: ["cancelled"] },
  });

  if (existingBooking) {
    res.status(400);
    throw new Error("This time slot is already booked");
  }

  // ─── CREATE APPOINTMENT (FIXED) ─────────────────────────────
  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),

    slotTime : {
      startTime,
      endTime: endTime || generateEndTime(startTime),
    },

    reason,
    type: type || "in-person",
    symptoms: symptoms || [],
    notes: { patient: notes },
    amount: doctor.consultationFee,
  });

  // ─── Notifications ─────────────────────────────
  await Notification.create({
    recipient: doctor.user._id,
    type: "appointment_booked",
    title: "New Appointment Booked",
    message: `${req.user.name} booked an appointment on ${new Date(
      appointmentDate
    ).toDateString()} at ${startTime}`,
    link: `/appointments/${appointment._id}`,
    relatedId: appointment._id,
  });

  await Notification.create({
    recipient: req.user._id,
    type: "appointment_booked",
    title: "Appointment Confirmed",
    message: `Your appointment with Dr. ${doctor.user.name} is booked for ${new Date(
      appointmentDate
    ).toDateString()} at ${startTime}`,
    link: `/appointments/${appointment._id}`,
    relatedId: appointment._id,
  });

  const populated = await appointment.populate([
    {
      path: "doctor",
      populate: { path: "user", select: "name avatar" },
    },
    {
      path: "patient",
      select: "name email avatar phone",
    },
  ]);

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully",
    appointment: populated,
  });
});

/**
 * @desc    Get appointments (filtered by role)
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let filter = {};

  if (req.user.role === "patient") {
    filter.patient = req.user._id;
  } else if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) { res.status(404); throw new Error("Doctor profile not found"); }
    filter.doctor = doctor._id;
  }
  // Admin sees all appointments (no filter)

  if (status) filter.status = status;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate({ path: "doctor", populate: { path: "user", select: "name avatar" } })
      .populate("patient", "name email avatar phone")
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    appointments,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
  });
});

/**
 * @desc    Get single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: "doctor", populate: { path: "user", select: "name avatar email phone" } })
    .populate("patient", "name email avatar phone bloodGroup")
    .populate("attachedReports");

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Authorization: only patient, their doctor, or admin can view
  const doctorUserId = appointment.doctor?.user?._id?.toString();
  if (
    req.user.role !== "admin" &&
    appointment.patient._id.toString() !== req.user._id.toString() &&
    doctorUserId !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this appointment");
  }

  res.json({ success: true, appointment });
});

/**
 * @desc    Update appointment status (doctor/admin)
 * @route   PUT /api/appointments/:id/status
 * @access  Private (Doctor/Admin)
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes, cancellationReason } = req.body;

  const appointment = await Appointment.findById(req.params.id)
    .populate("patient", "name")
    .populate({ path: "doctor", populate: { path: "user", select: "name" } });

  if (!appointment) { res.status(404); throw new Error("Appointment not found"); }

  appointment.status = status;
  if (notes) appointment.notes.doctor = notes;
  if (cancellationReason) {
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy = req.user.role;
  }

  await appointment.save();

  // Notify patient of status change
  await Notification.create({
    recipient: appointment.patient._id,
    type: `appointment_${status}`,
    title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your appointment with Dr. ${appointment.doctor.user.name} has been ${status}.`,
    relatedId: appointment._id,
    link: `/appointments/${appointment._id}`,
  });

  res.json({ success: true, message: `Appointment ${status}`, appointment });
});

/**
 * @desc    Cancel appointment (patient or doctor)
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private
 */
const cancelAppointment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const appointment = await Appointment.findById(req.params.id)
    .populate("patient", "name _id")
    .populate({ path: "doctor", populate: { path: "user", select: "name _id" } });

  if (!appointment) { res.status(404); throw new Error("Appointment not found"); }

  // Only patient, their doctor, or admin can cancel
  if (
    req.user.role !== "admin" &&
    appointment.patient._id.toString() !== req.user._id.toString() &&
    appointment.doctor.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to cancel this appointment");
  }

  if (["cancelled", "completed"].includes(appointment.status)) {
    res.status(400);
    throw new Error(`Cannot cancel an appointment that is already ${appointment.status}`);
  }

  appointment.status = "cancelled";
  appointment.cancellationReason = reason;
  appointment.cancelledBy = req.user.role;
  await appointment.save();

  res.json({ success: true, message: "Appointment cancelled successfully" });
});

/**
 * @desc    Reschedule appointment
 * @route   PUT /api/appointments/:id/reschedule
 * @access  Private (Patient)
 */
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, slotTime } = req.body;
  const original = await Appointment.findById(req.params.id);

  if (!original) { res.status(404); throw new Error("Appointment not found"); }

  if (original.patient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the patient can reschedule their appointment");
  }

  // Check new slot availability
  const conflict = await Appointment.findOne({
    doctor: original.doctor,
    appointmentDate: new Date(appointmentDate),
    "slotTime.startTime": slotTime.startTime,
    status: { $nin: ["cancelled"] },
    _id: { $ne: original._id },
  });

  if (conflict) { res.status(400); throw new Error("New time slot is not available"); }

  // Cancel original and create new one
  original.status = "rescheduled";
  await original.save();

  const newAppointment = await Appointment.create({
    patient: original.patient,
    doctor: original.doctor,
    appointmentDate: new Date(appointmentDate),
    slotTime,
    reason: original.reason,
    type: original.type,
    amount: original.amount,
    rescheduledFrom: original._id,
  });

  res.json({ success: true, message: "Appointment rescheduled", appointment: newAppointment });
});

/**
 * @desc    Add prescription to appointment
 * @route   PUT /api/appointments/:id/prescription
 * @access  Private (Doctor)
 */
const addPrescription = asyncHandler(async (req, res) => {
  const { medicines, instructions } = req.body;

  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: "doctor", select: "user" });

  if (!appointment) { res.status(404); throw new Error("Appointment not found"); }

  if (appointment.doctor.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the treating doctor can add a prescription");
  }

  appointment.prescription = { medicines, instructions, issuedAt: new Date() };
  appointment.status = "completed";
  await appointment.save();

  // Notify patient
  await Notification.create({
    recipient: appointment.patient,
    type: "prescription_ready",
    title: "Prescription Ready",
    message: "Your doctor has added a prescription to your appointment.",
    relatedId: appointment._id,
    link: `/appointments/${appointment._id}`,
  });

  res.json({ success: true, message: "Prescription added", appointment });
});


const getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!doctorId || !date) {
    res.status(400);
    throw new Error("DoctorId and date are required");
  }

  // Example logic (replace with real logic later)
  const slots = [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  res.json({ success: true, slots });
});
module.exports = {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  addPrescription,
  getAvailableSlots,
};