const express = require("express");
const { getNotifications, markAsRead, deleteNotification } = require("../controllers/notification.controller");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", protect, getNotifications);
router.put("/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);
module.exports = router;