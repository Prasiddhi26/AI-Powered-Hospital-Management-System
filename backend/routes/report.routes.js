// routes/reportRoutes.js
const express = require("express");
const { uploadReport, getMyReports, getPatientReports, deleteReport, shareReport } = require("../controllers/report.controller");
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const router = express.Router();
router.post("/upload", protect, authorize("patient"), upload.single("report"), uploadReport);
router.get("/", protect, authorize("patient"), getMyReports);
router.get("/patient/:patientId", protect, authorize("doctor", "admin"), getPatientReports);
router.delete("/:id", protect, authorize("patient"), deleteReport);
router.put("/:id/share", protect, authorize("patient"), shareReport);
module.exports = router;