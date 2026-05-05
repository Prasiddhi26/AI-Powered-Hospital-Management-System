//const asyncHandler = require("express-async-handler");
const MedicalReport = require("../models/MedicalReport.model");
const { cloudinary } = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Upload medical report
 * @route   POST /api/reports/upload
 * @access  Private (Patient)
 */
const uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please select a file to upload");
  }

  const { title, description, reportType, reportDate, labName, appointmentId } = req.body;

  if (!title) { res.status(400); throw new Error("Report title is required"); }

  // Determine file type from mimetype
  const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";

  const report = await MedicalReport.create({
    patient: req.user._id,
    title,
    description,
    reportType: reportType || "other",
    fileUrl: req.file.path,        // Cloudinary URL
    publicId: req.file.filename,   // Cloudinary public_id
    fileType,
    fileSize: req.file.size,
    reportDate: reportDate ? new Date(reportDate) : new Date(),
    labName,
    appointment: appointmentId || undefined,
  });

  res.status(201).json({ success: true, message: "Report uploaded successfully", report });
});

/**
 * @desc    Get all reports for logged-in patient
 * @route   GET /api/reports
 * @access  Private (Patient)
 */
const getMyReports = asyncHandler(async (req, res) => {
  const { reportType, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { patient: req.user._id };
  if (reportType) filter.reportType = reportType;

  const [reports, total] = await Promise.all([
    MedicalReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    MedicalReport.countDocuments(filter),
  ]);

  res.json({ success: true, reports, total, totalPages: Math.ceil(total / Number(limit)) });
});

/**
 * @desc    Get reports for a patient (doctor viewing)
 * @route   GET /api/reports/patient/:patientId
 * @access  Private (Doctor/Admin)
 */
const getPatientReports = asyncHandler(async (req, res) => {
  const reports = await MedicalReport.find({
    patient: req.params.patientId,
    isPrivate: false,
  }).sort({ createdAt: -1 });

  res.json({ success: true, reports });
});

/**
 * @desc    Delete a report (patient only)
 * @route   DELETE /api/reports/:id
 * @access  Private (Patient)
 */
const deleteReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id);

  if (!report) { res.status(404); throw new Error("Report not found"); }

  if (report.patient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this report");
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(report.publicId, { resource_type: "auto" });
  } catch (cloudErr) {
    console.error("Cloudinary delete error:", cloudErr.message);
  }

  await report.deleteOne();

  res.json({ success: true, message: "Report deleted successfully" });
});

/**
 * @desc    Share report with a doctor
 * @route   PUT /api/reports/:id/share
 * @access  Private (Patient)
 */
const shareReport = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  const report = await MedicalReport.findById(req.params.id);

  if (!report) { res.status(404); throw new Error("Report not found"); }
  if (report.patient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (!report.sharedWith.includes(doctorId)) {
    report.sharedWith.push(doctorId);
    await report.save();
  }

  res.json({ success: true, message: "Report shared with doctor" });
});

module.exports = { uploadReport, getMyReports, getPatientReports, deleteReport, shareReport };