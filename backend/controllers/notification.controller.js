//const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Get notifications for logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.json({ success: true, notifications, total, unreadCount });
});

/**
 * @desc    Mark notification(s) as read
 * @route   PUT /api/notifications/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body; // Array of IDs, or empty for "mark all"

  if (notificationIds && notificationIds.length > 0) {
    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: req.user._id },
      { isRead: true }
    );
  } else {
    // Mark all as read
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  }

  res.json({ success: true, message: "Notifications marked as read" });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) { res.status(404); throw new Error("Notification not found"); }

  res.json({ success: true, message: "Notification deleted" });
});

module.exports = { getNotifications, markAsRead, deleteNotification };