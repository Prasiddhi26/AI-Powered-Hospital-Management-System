//const asyncHandler = require("express-async-handler");
const User = require("../models/User.model");
const Doctor = require("../models/Doctor.model");
const Appointment = require("../models/Appointment.model");
const MedicalReport = require("../models/MedicalReport.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Get dashboard stats for admin
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalDoctors, totalAppointments, pendingDoctors, recentAppointments] =
    await Promise.all([
      User.countDocuments({ role: "patient" }),
      Doctor.countDocuments({ isVerified: true }),
      Appointment.countDocuments(),
      Doctor.countDocuments({ isVerified: false }),
      Appointment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("patient", "name email")
        .populate({ path: "doctor", populate: { path: "user", select: "name" } }),
    ]);

  // Appointment status breakdown
  const statusStats = await Appointment.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalPatients: totalUsers,
      totalDoctors,
      totalAppointments,
      pendingDoctorVerifications: pendingDoctors,
    },
    statusBreakdown: statusStats,
    recentAppointments,
  });
});

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (role) filter.role = role;
  if (search) filter.name = { $regex: search, $options: "i" };

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, total, totalPages: Math.ceil(total / Number(limit)) });
});

/**
 * @desc    Verify or unverify a doctor
 * @route   PUT /api/admin/doctors/:id/verify
 * @access  Private (Admin)
 */
const verifyDoctor = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;
  const doctor = await Doctor.findById(req.params.id).populate("user", "name email");

  if (!doctor) { res.status(404); throw new Error("Doctor not found"); }

  doctor.isVerified = isVerified;
  await doctor.save();

  res.json({
    success: true,
    message: `Doctor ${isVerified ? "verified" : "unverified"} successfully`,
    doctor,
  });
});

/**
 * @desc    Toggle user active/inactive status
 * @route   PUT /api/admin/users/:id/toggle
 * @access  Private (Admin)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}` });
});

/**
 * @desc    Get all pending doctor verifications
 * @route   GET /api/admin/doctors/pending
 * @access  Private (Admin)
 */
const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ isVerified: false })
    .populate("user", "name email phone createdAt")
    .sort({ createdAt: -1 });

  res.json({ success: true, doctors });
});

module.exports = { getDashboardStats, getAllUsers, verifyDoctor, toggleUserStatus, getPendingDoctors };