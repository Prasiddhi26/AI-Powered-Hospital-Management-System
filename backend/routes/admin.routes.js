const express = require("express");
const { getDashboardStats, getAllUsers, verifyDoctor, toggleUserStatus, getPendingDoctors } = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/authMiddleware");
const router = express.Router();
router.use(protect, authorize("admin")); // All admin routes require admin role
router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/doctors/pending", getPendingDoctors);
router.put("/doctors/:id/verify", verifyDoctor);
router.put("/users/:id/toggle", toggleUserStatus);
module.exports = router;