const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "appointment_booked",
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_reminder",
        "appointment_completed",
        "report_uploaded",
        "prescription_ready",
        "doctor_verified",
        "general",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: String, // Optional deep-link path in the app
    relatedId: mongoose.Schema.Types.ObjectId, // e.g. appointment ID
  },
  { timestamps: true }
);

// Index for fast unread count queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);