// routes/userRoutes.js
const express = require("express");
const { updateProfile, changePassword, updateAvatar } = require("../controllers/user.controller");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const router = express.Router();
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
module.exports = router;