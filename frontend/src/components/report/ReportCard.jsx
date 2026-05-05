/**
 * ReportCard.jsx
 * Medical report display card with preview, download, delete, and AI analysis.
 *
 * Props:
 *   report        {object}   required
 *   onDelete      (reportId) => void   optional
 *   onAnalyze     (report) => void     optional — triggers AI analysis
 *   compact       {boolean}
 */

import { useState } from "react";
//import axios from "../api/index";
import API from "../../api";
import axios from "axios";
//import { useToast } from "./ToastProvider";

// ─── Report type badge colours ─────────────────────────────────────────────────
const TYPE_COLORS = {
  "Blood Test":        "bg-red-500/10 text-red-400 border-red-500/20",
  "X-Ray":             "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "MRI":               "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "CT Scan":           "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "ECG":               "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Ultrasound":        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Pathology":         "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Prescription":      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Discharge Summary": "bg-slate-500/10 text-slate-300 border-slate-500/20",
  Other:               "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const getBadgeClass = (type) =>
  TYPE_COLORS[type] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "Unknown date";

const isPDF = (url = "") => url.toLowerCase().includes(".pdf") || url.includes("/raw/");

// ─── Confirm delete dialog ─────────────────────────────────────────────────────
const DeleteConfirm = ({ onConfirm, onCancel, loading }) => (
  <div className="absolute inset-0 z-10 bg-slate-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center gap-3">
    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
      </svg>
    </div>
    <p className="text-white font-semibold text-sm">Delete this report?</p>
    <p className="text-slate-500 text-xs">This action cannot be undone.</p>
    <div className="flex gap-2 w-full">
      <button onClick={onCancel} className="flex-1 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs hover:border-slate-500 transition-colors">
        Keep
      </button>
      <button onClick={onConfirm} disabled={loading}
        className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50">
        {loading ? "Deleting…" : "Delete"}
      </button>
    </div>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────
const ReportCard = ({ report, onDelete, onAnalyze, compact = false }) => {
  const toast = toast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(false);

  const isImage = !isPDF(report.fileUrl);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/reports/${report._id}`);
      toast.success("Report deleted successfully.");
      onDelete?.(report._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete report.");
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleAnalyze = async () => {
    if (onAnalyze) {
      onAnalyze(report);
      return;
    }
    // Default: call API
    try {
      setAnalyzing(true);
      const { data } = await axios.post(`/ai/analyze-report/${report._id}`);
      toast.info("AI analysis complete! Check the results panel.");
      // Optionally pass back result
    } catch (err) {
      toast.error(err.response?.data?.message || "AI analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className={`relative bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-200 ${compact ? "" : "hover:shadow-lg hover:shadow-slate-950/30"}`}>
      {showDelete && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}

      <div className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start gap-3">
          {/* Thumbnail / icon */}
          <div className="flex-shrink-0">
            {isImage ? (
              <div
                className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-600 cursor-pointer hover:border-cyan-500/50 transition-all"
                onClick={() => setPreview(true)}
              >
                <img
                  src={report.fileUrl}
                  alt="report"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            ) : (
              <a href={report.fileUrl} target="_blank" rel="noreferrer"
                className="w-12 h-12 rounded-xl bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center hover:border-red-500/40 transition-all">
                <span className="text-xs font-bold text-red-400">PDF</span>
              </a>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={`inline-block px-2 py-0.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider ${getBadgeClass(report.reportType)}`}>
                {report.reportType || "Report"}
              </span>
              {report.aiAnalyzed && (
                <span className="inline-block px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] rounded-lg font-semibold uppercase tracking-wider">
                  🤖 AI Analyzed
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-white mt-1.5 truncate">
              {report.description || report.reportType || "Medical Report"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDate(report.reportDate || report.createdAt)}
            </p>
          </div>

          {/* Actions menu */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* Download */}
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
              </svg>
            </a>

            {/* AI analyze */}
            {(onAnalyze !== null) && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                title="AI Analysis"
                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
              >
                {analyzing ? (
                  <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z" />
                  </svg>
                )}
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => setShowDelete(true)}
                title="Delete"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* AI analysis preview */}
        {report.aiAnalysis && !compact && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-1.5">
              🤖 AI Summary
            </p>
            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
              {report.aiAnalysis}
            </p>
          </div>
        )}
      </div>

      {/* Full-screen image preview modal */}
      {preview && isImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(false)}
              className="absolute -top-4 -right-4 w-8 h-8 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={report.fileUrl}
              alt="Medical report preview"
              className="max-w-full max-h-[85vh] rounded-2xl border border-slate-700 object-contain"
            />
            <p className="text-center text-slate-500 text-xs mt-3">
              {report.description || report.reportType} — {formatDate(report.reportDate || report.createdAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCard;