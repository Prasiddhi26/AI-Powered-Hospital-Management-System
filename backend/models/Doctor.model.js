const mongoose = require("mongoose");

// Time slot sub-schema
const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true },   // e.g. "17:00"
  isAvailable: { type: Boolean, default: true },
});

// Review sub-schema
const reviewSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"],
    },
    experience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: 0,
    },
    licenseNumber: {
      type: String,
      required: [true, "Medical license number is required"],
      unique: true,
    },
    hospital: {
      type: String,
      trim: true,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    languages: [String],
    timeSlots: [timeSlotSchema],
    reviews: [reviewSchema],
    // Computed rating fields (updated on review add)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false, // Admin verifies doctors
    },
    isAcceptingAppointments: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Recalculate average rating whenever reviews change
doctorSchema.methods.updateRating = async function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = Math.round((total / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
  }
  await this.save();
};

module.exports = mongoose.model("Doctor", doctorSchema);