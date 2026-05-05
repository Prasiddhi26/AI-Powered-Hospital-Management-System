//const asyncHandler = require("express-async-handler");
const User = require("../models/User.model");
const Doctor = require("../models/Doctor.model");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Register new user (patient, doctor, or admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, gender, dateOfBirth } = req.body;

  // ── Validate required fields ────────────────────────────────────────────────
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  // ── Prevent admin self-registration ────────────────────────────────────────
  if (role === "admin") {
    res.status(403);
    throw new Error("Admin registration is not allowed via this endpoint");
  }

  // ── Duplicate email check ───────────────────────────────────────────────────
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    res.status(400);
    throw new Error("Email is already registered");
  }

  // ── Build user payload — ONLY set optional fields when they have real values
  //    Empty string "" passed to a Mongoose enum field causes ValidationError → 500
  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role === "doctor" ? "doctor" : "patient",
  };

  if (phone && phone.trim())   userData.phone = phone.trim();
  if (gender)                  userData.gender = gender;       // falsy guard skips ""
  if (dateOfBirth)             userData.dateOfBirth = dateOfBirth;

  // ── Create user ─────────────────────────────────────────────────────────────
  const user = await User.create(userData);

  // ── If doctor, create doctor profile ───────────────────────────────────────
  if (userData.role === "doctor") {
    const {
      specialization, qualification, experience,
      licenseNumber, hospital, consultationFee, bio,
    } = req.body;

    // Validate required doctor fields — rollback user if missing
    if (!specialization || !qualification || !experience || !licenseNumber) {
      await User.findByIdAndDelete(user._id);
      res.status(400);
      throw new Error(
        "Doctor fields (specialization, qualification, experience, licenseNumber) are required"
      );
    }

    await Doctor.create({
      user: user._id,
      specialization,
      qualification,
      experience: Number(experience) || 0,
      licenseNumber,
      hospital,
      consultationFee: Number(consultationFee) || 0,
      bio,
    });
  }

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // password has select:false — must explicitly include it
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Please contact support.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Update last login timestamp without triggering full validation
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
    },
  });
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Attach doctor profile if applicable
  let doctorProfile = null;
  if (user.role === "doctor") {
    doctorProfile = await Doctor.findOne({ user: user._id });
  }

  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      bloodGroup: user.bloodGroup,
      lastLogin: user.lastLogin,
      doctorProfile,
    },
  });
});

module.exports = { register, login, getMe };