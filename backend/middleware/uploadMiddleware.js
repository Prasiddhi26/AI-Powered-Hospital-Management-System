/**
 * uploadMiddleware.js
 * Multer configuration for medical report uploads
 * Storage: Cloudinary (free tier)
 * Supported formats: PDF, JPEG, PNG, WEBP
 */

const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// ─── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const ALLOWED_EXTENSIONS = /jpeg|jpg|png|webp|pdf/;

// ─── Cloudinary Storage Engine ─────────────────────────────────────────────────
const medicalReportStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    return {
      folder: "hospital_app/medical_reports",
      resource_type: isImage ? "image" : "raw", // PDFs need "raw"
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      public_id: `report_${req.user._id}_${Date.now()}`,
      // Optional: auto-tag for easier management
      tags: ["medical_report", `user_${req.user._id}`],
    };
  },
});

// ─── Profile Photo Storage ─────────────────────────────────────────────────────
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "hospital_app/profile_photos",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: `profile_${req.user._id}_${Date.now()}`,
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  }),
});

// ─── File Filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_EXTENSIONS.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type: "${file.originalname}". Only JPEG, PNG, WEBP, and PDF files are allowed.`
    ),
    false
  );
};

// ─── Image-Only Filter ─────────────────────────────────────────────────────────
const imageOnlyFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed for profile photos."), false);
};

// ─── Multer Instances ──────────────────────────────────────────────────────────

/** For medical report uploads (PDF + images, max 10MB) */
const uploadReport = multer({
  storage: medicalReportStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5,                   // max 5 files per request
  },
});

/** For profile photo uploads (images only, max 2MB) */
const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1,
  },
});

// ─── Multer Error Handler ──────────────────────────────────────────────────────
/**
 * Wrap multer middleware to catch MulterError and custom errors cleanly.
 * Usage: router.post("/upload", handleUpload(uploadReport.array("files", 5)), controller)
 */
const handleUpload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed size is 10MB per file.",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum 5 files allowed per upload.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: `Unexpected field name: "${err.field}". Use the correct field name.`,
      });
    }

    // Custom fileFilter error or Cloudinary error
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed.",
    });
  });
};

module.exports = {
  uploadReport,
  uploadProfilePhoto,
  handleUpload,
};