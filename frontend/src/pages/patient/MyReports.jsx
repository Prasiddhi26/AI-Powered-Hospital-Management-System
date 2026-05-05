import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import UploadForm from "../../components/report/UploadForm";
import ReportCard from "../../components/report/ReportCard";
import api from "../../api";

const REPORT_TYPES = ["All", "Blood Test", "X-Ray", "MRI", "CT Scan", "ECG", "Prescription", "Other"];

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports");
      setReports(res.data?.reports || res.data || []);
    } catch (err) {
      toast.error("Failed to load reports. Please try again.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0]);
      setShowUploadForm(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: (files) => {
      setDragActive(false);
      if (files[0]?.errors[0]?.code === "file-too-large") {
        toast.error("File too large. Maximum size is 10MB.");
      } else {
        toast.error("Invalid file type. Only PDF, JPEG, PNG allowed.");
      }
    },
  });

  const handleUploadSuccess = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
    setShowUploadForm(false);
    setPendingFile(null);
    toast.success("Report uploaded successfully!");
  };

  const handleDelete = async (reportId) => {
    try {
      await api.delete(`/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      toast.success("Report deleted.");
    } catch (err) {
      toast.error("Failed to delete report.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesType = selectedType === "All" || report.reportType === selectedType;
    const matchesSearch =
      searchQuery === "" ||
      report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: reports.length,
    thisMonth: reports.filter((r) => {
      const d = new Date(r.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    types: [...new Set(reports.map((r) => r.reportType))].length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Medical Reports
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Securely store and manage your health records
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            Upload Report
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: "Total Reports", value: stats.total, icon: "📋" },
            { label: "This Month", value: stats.thisMonth, icon: "📅" },
            { label: "Report Types", value: stats.types, icon: "🗂️" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">Upload Medical Report</h2>
              <button
                onClick={() => { setShowUploadForm(false); setPendingFile(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <UploadForm
                prefillFile={pendingFile}
                onSuccess={handleUploadSuccess}
                onCancel={() => { setShowUploadForm(false); setPendingFile(null); }}
                onProgress={setUploadProgress}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Delete Report?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This action cannot be undone. The report will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div>
                <h3 className="text-white font-semibold text-sm">{previewFile.title}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{previewFile.reportType}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewFile.fileUrl?.endsWith(".pdf") || previewFile.fileType === "application/pdf" ? (
                <iframe
                  src={previewFile.fileUrl}
                  className="w-full h-96 rounded-lg"
                  title="Report Preview"
                />
              ) : (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.title}
                  className="w-full rounded-lg object-contain max-h-[60vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone (shown when no upload form is open) */}
      {!showUploadForm && (
        <div
          {...getRootProps()}
          className={`relative mb-6 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive || dragActive
              ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
              : "border-slate-700 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div
              className={`p-4 rounded-full transition-colors ${
                isDragActive ? "bg-cyan-500/20" : "bg-slate-800"
              }`}
            >
              <CloudArrowUpIcon
                className={`w-8 h-8 ${isDragActive ? "text-cyan-400" : "text-slate-400"}`}
              />
            </div>
            <div>
              <p className={`font-semibold ${isDragActive ? "text-cyan-400" : "text-slate-300"}`}>
                {isDragActive ? "Drop your file here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-slate-500 text-sm mt-1">PDF, JPEG, PNG · Max 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {REPORT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedType === type
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-700/60 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-700/40 rounded mb-2" />
              <div className="h-3 bg-slate-700/40 rounded w-2/3" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-slate-700/40 rounded-lg flex-1" />
                <div className="h-8 bg-slate-700/40 rounded-lg w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-slate-300 font-semibold mb-2">
            {searchQuery || selectedType !== "All" ? "No matching reports" : "No reports yet"}
          </h3>
          <p className="text-slate-500 text-sm">
            {searchQuery || selectedType !== "All"
              ? "Try adjusting your search or filters"
              : "Upload your first medical report to get started"}
          </p>
          {!searchQuery && selectedType === "All" && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm hover:bg-cyan-500/20 transition-colors"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
              Upload Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              onPreview={() => setPreviewFile(report)}
              onDelete={() => setDeleteConfirm(report._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}