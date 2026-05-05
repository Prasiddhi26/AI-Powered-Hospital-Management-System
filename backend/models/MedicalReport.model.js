const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    reportType: {
      type: String,
      enum: [
        "blood-test",
        "x-ray",
        "mri",
        "ct-scan",
        "ecg",
        "urine-test",
        "prescription",
        "discharge-summary",
        "other",
      ],
      default: "other",
    },
    fileUrl: {
      type: String,
      required: true, // Cloudinary URL
    },
    publicId: {
      type: String,
      required: true, // Cloudinary public_id for deletion
    },
    fileType: {
      type: String,
      enum: ["image", "pdf"],
    },
    fileSize: Number, // in bytes
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor", // Doctors who can view this report
      },
    ],
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    labName: String,
    reportDate: Date,
    tags: [String],
  },
  { timestamps: true }
);

// Index for patient report lookups
medicalReportSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model("MedicalReport", medicalReportSchema);