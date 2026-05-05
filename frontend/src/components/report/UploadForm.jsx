/**
 * UploadForm.jsx
 * Reusable medical report upload form.
 * Supports PDF + images, drag-and-drop, multi-file, progress indication.
 * Uploads to backend → Cloudinary via API.
 *
 * Props:
 *   onSuccess     (reports[]) => void
 *   onCancel      () => void
 *   maxFiles      {number} default 5
 *   compact       {boolean} compact mode for embedding in other pages
 */

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
//import axios from "../api/index";
//import { useToast } from "./ToastProvider";
import API from "../../api";
import { toast } from "react-hot-toast";
import axios from "axios";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
const ACCEPTED_EXTS = Object.values(ACCEPTED_TYPES).flat();
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const REPORT_TYPES = [
  "Blood Test", "X-Ray", "MRI", "CT Scan", "ECG",
  "Ultrasound", "Pathology", "Prescription", "Discharge Summary", "Other",
];

// ─── File type icon ────────────────────────────────────────────────────────────
const FileTypeIcon = ({ type }) => {
  const isPDF = type === "application/pdf";
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${
      isPDF
        ? "bg-red-500/10 border-red-500/20 text-red-400"
        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
    }`}>
      {isPDF ? "PDF" : "IMG"}
    </div>
  );
};

// ─── Single file preview row ───────────────────────────────────────────────────
const FileRow = ({ file, progress, onRemove }) => {
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const done = progress === 100;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
      <FileTypeIcon type={file.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-slate-500">{sizeMB} MB</p>
          {progress !== undefined && (
            <>
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    done ? "bg-emerald-500" : "bg-cyan-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${done ? "text-emerald-400" : "text-cyan-400"}`}>
                {done ? "✓ Done" : `${progress}%`}
              </span>
            </>
          )}
        </div>
      </div>
      {progress === undefined && (
        <button
          type="button"
          onClick={() => onRemove(file.name)}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ─── Validate files ────────────────────────────────────────────────────────────
const validateFiles = (fileList, maxFiles) => {
  const errors = [];
  const valid = [];

  Array.from(fileList).forEach((f) => {
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      errors.push(`"${f.name}" — unsupported format. Only PDF, JPEG, PNG, WEBP allowed.`);
    } else if (f.size > MAX_SIZE_BYTES) {
      errors.push(`"${f.name}" — exceeds ${MAX_SIZE_MB}MB limit.`);
    } else {
      valid.push(f);
    }
  });

  if (valid.length > maxFiles) {
    errors.push(`Max ${maxFiles} files allowed per upload.`);
    return { valid: valid.slice(0, maxFiles), errors };
  }

  return { valid, errors };
};

// ─── Component ─────────────────────────────────────────────────────────────────
const UploadForm = ({ onSuccess, onCancel, maxFiles = 5, compact = false }) => {
  const toast = toast();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { reportType: "Blood Test", description: "", reportDate: "" },
  });

  // ── File handling ────────────────────────────────────────────────────────
  const addFiles = useCallback(
    (fileList) => {
      const { valid, errors: errs } = validateFiles(fileList, maxFiles - files.length);
      errs.forEach((e) => toast.warning(e));
      if (valid.length) setFiles((prev) => [...prev, ...valid]);
    },
    [files.length, maxFiles, toast]
  );

  const removeFile = (name) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    if (!files.length) {
      toast.warning("Please select at least one file to upload.");
      return;
    }

    try {
      setUploading(true);
      const uploaded = [];

      for (const file of files) {
        const fd = new FormData();
        fd.append("files", file);
        fd.append("reportType", formData.reportType);
        fd.append("description", formData.description);
        fd.append("reportDate", formData.reportDate);

        const { data } = await axios.post("/reports/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setProgressMap((prev) => ({ ...prev, [file.name]: pct }));
          },
        });

        uploaded.push(...(data.reports || [data.report] || []));
      }

      toast.success(`${uploaded.length} report${uploaded.length > 1 ? "s" : ""} uploaded successfully!`);
      reset();
      setFiles([]);
      setProgressMap({});
      onSuccess?.(uploaded);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed. Please try again.");
      setProgressMap({});
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          dragOver
            ? "border-cyan-500 bg-cyan-500/5 scale-[1.01]"
            : "border-slate-700 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-slate-800/60"
        } ${uploading ? "pointer-events-none opacity-60" : ""} ${compact ? "py-8" : "py-12"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTS.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          disabled={uploading}
        />
        <div className="text-center px-4">
          <div className={`mx-auto mb-3 rounded-2xl bg-slate-700/50 flex items-center justify-center ${compact ? "w-12 h-12" : "w-16 h-16"}`}>
            <svg className={`text-cyan-400 ${compact ? "w-6 h-6" : "w-8 h-8"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 .93 11.1H6.75z" />
            </svg>
          </div>
          <p className={`font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>
            {dragOver ? "Drop files here" : "Upload Medical Reports"}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Drag & drop or click — PDF, JPEG, PNG, WEBP — max {MAX_SIZE_MB}MB each
          </p>
          {files.length < maxFiles && (
            <span className="inline-block mt-3 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs rounded-lg">
              {files.length}/{maxFiles} files selected
            </span>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <FileRow
              key={f.name}
              file={f}
              progress={uploading ? progressMap[f.name] : undefined}
              onRemove={removeFile}
            />
          ))}
        </div>
      )}

      {/* Report metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Report Type <span className="text-red-400">*</span>
          </label>
          <select
            {...register("reportType", { required: "Report type is required." })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.reportType && (
            <p className="text-red-400 text-xs mt-1">{errors.reportType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Report Date
          </label>
          <input
            type="date"
            {...register("reportDate")}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all [color-scheme:dark]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Description <span className="text-slate-600 font-normal normal-case">(optional)</span>
        </label>
        <textarea
          {...register("description", {
            maxLength: { value: 300, message: "Description too long (max 300 chars)." },
          })}
          rows={2}
          placeholder="Brief description of this report or test…"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
        />
        {errors.description && (
          <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl hover:border-slate-500 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="flex-1 py-3 bg-cyan-500 text-slate-900 font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-700 border-t-slate-900 rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3" />
              </svg>
              Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? "s" : ""}` : "Reports"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UploadForm;