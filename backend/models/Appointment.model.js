const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    slotTime: {
      startTime: { type: String, required: true }, // e.g. "10:00"
      endTime: { type: String, required: true },   // e.g. "10:30"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled", "no-show"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["in-person", "video", "phone"],
      default: "in-person",
    },
    reason: {
      type: String,
      required: [true, "Reason for visit is required"],
      trim: true,
    },
    symptoms: [String], // From AI symptom checker
    notes: {
      patient: String,   // Patient's additional notes
      doctor: String,    // Doctor's notes / prescription
    },
    prescription: {
      medicines: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
        },
      ],
      instructions: String,
      issuedAt: Date,
    },
    attachedReports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalReport",
      },
    ],
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "waived"],
      default: "pending",
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for efficient date-based queries
appointmentSchema.index({ appointmentDate: 1, doctor: 1 });
appointmentSchema.index({ patient: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);