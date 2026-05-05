//const asyncHandler = require("express-async-handler");
const User = require("../models/User.model");
const { cloudinary } = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const allowedFields = ["name", "phone", "gender", "dateOfBirth", "address", "bloodGroup"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  const updated = await user.save();

  res.json({
    success: true,
    message: "Profile updated",
    user: { _id: updated._id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Both current and new password are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully" });
});

/**
 * @desc    Upload/update avatar
 * @route   PUT /api/users/avatar
 * @access  Private
 */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image");
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary if exists
  if (user.avatar && user.avatar.includes("cloudinary")) {
    const publicId = user.avatar.split("/").pop().split(".")[0];
    try {
      await cloudinary.uploader.destroy(`mediflow/avatars/${publicId}`);
    } catch (e) { /* ignore */ }
  }

  user.avatar = req.file.path;
  await user.save();

  res.json({ success: true, message: "Avatar updated", avatar: user.avatar });
});

module.exports = { updateProfile, changePassword, updateAvatar };