//const asyncHandler = require("express-async-handler");
const Doctor = require("../models/Doctor.model");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Get all verified doctors (with search & filter)
 * @route   GET /api/doctors
 * @access  Public
 */
const getDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, minExperience, maxFee, page = 1, limit = 12 } = req.query;

  // Build filter query
  const filter = { isVerified: true };

  if (specialization) filter.specialization = { $regex: specialization, $options: "i" };
  if (minExperience) filter.experience = { $gte: Number(minExperience) };
  if (maxFee) filter.consultationFee = { $lte: Number(maxFee) };

  // Build user lookup filter (for name search)
  const userFilter = {};
  if (search) {
    userFilter.name = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  let query = Doctor.find(filter)
    .populate({ path: "user", select: "name email avatar phone gender", match: userFilter })
    .sort({ averageRating: -1, experience: -1 })
    .skip(skip)
    .limit(Number(limit));

  let doctors = await query;

  // Filter out nulls (when user match fails)
  if (search) {
    doctors = doctors.filter((d) => d.user !== null);
  }

  const total = await Doctor.countDocuments(filter);

  res.json({
    success: true,
    count: doctors.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    doctors,
  });
});

/**
 * @desc    Get single doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate("user", "name email avatar phone gender")
    .populate("reviews.patient", "name avatar");

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.json({ success: true, doctor });
});

/**
 * @desc    Update doctor profile (by doctor themselves)
 * @route   PUT /api/doctors/profile
 * @access  Private (Doctor only)
 */
const updateDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor profile not found");
  }

  const allowedFields = [
    "specialization", "qualification", "experience", "hospital",
    "consultationFee", "bio", "languages", "timeSlots", "isAcceptingAppointments"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      doctor[field] = req.body[field];
    }
  });

  await doctor.save();

  res.json({ success: true, message: "Profile updated successfully", doctor });
});

/**
 * @desc    Add a review for a doctor (patient only)
 * @route   POST /api/doctors/:id/reviews
 * @access  Private (Patient only)
 */
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  // Check if patient already reviewed this doctor
  const alreadyReviewed = doctor.reviews.find(
    (r) => r.patient.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("You have already reviewed this doctor");
  }

  doctor.reviews.push({ patient: req.user._id, rating, comment });
  await doctor.updateRating();

  res.status(201).json({ success: true, message: "Review added successfully" });
});

/**
 * @desc    Get unique specializations list
 * @route   GET /api/doctors/specializations
 * @access  Public
 */
const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct("specialization", { isVerified: true });
  res.json({ success: true, specializations: specializations.sort() });
});

module.exports = { getDoctors, getDoctorById, updateDoctorProfile, addReview, getSpecializations };