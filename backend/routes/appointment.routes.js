const express = require("express");
const {
  bookAppointment, getAppointments, getAppointmentById,
  updateAppointmentStatus, cancelAppointment, rescheduleAppointment, addPrescription, getAvailableSlots,
} = require("../controllers/appointment.controller");
const { protect, authorize } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, authorize("patient"), bookAppointment);
router.get("/", protect, getAppointments);
router.get("/:id", protect, getAppointmentById);
router.put("/:id/status", protect, authorize("doctor", "admin"), updateAppointmentStatus);
router.put("/:id/cancel", protect, cancelAppointment);
router.put("/:id/reschedule", protect, authorize("patient"), rescheduleAppointment);
router.put("/:id/prescription", protect, authorize("doctor"), addPrescription);
router.get("/slots/:doctorId", protect, getAvailableSlots);

module.exports = router;