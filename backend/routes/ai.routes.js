const express = require("express");
const { analyzeSymptoms, suggestSpecialty } = require("../controllers/ai.controller");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/symptom-check", protect, analyzeSymptoms);
router.post("/suggest-specialty", protect, suggestSpecialty);
module.exports = router;