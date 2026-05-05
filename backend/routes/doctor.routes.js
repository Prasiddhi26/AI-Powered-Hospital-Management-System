const express = require("express");
const { getDoctors, getDoctorById, updateDoctorProfile, addReview, getSpecializations } = require("../controllers/doctor.controller");
const { protect, authorize } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", getDoctors);
router.get("/specializations", getSpecializations);
router.get("/:id", getDoctorById);
router.put("/profile", protect, authorize("doctor"), updateDoctorProfile);
router.post("/:id/reviews", protect, authorize("patient"), addReview);

module.exports = router;