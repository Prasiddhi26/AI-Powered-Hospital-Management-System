/**
 * ToastProvider.jsx
 * Centralized toast notification provider using react-toastify.
 * Wrap your App with <ToastProvider> once; use toast() anywhere.
 *
 * Usage:
 *   import { useToast } from "../components/ToastProvider";
 *   const { success, error, info, warning, promise } = useToast();
 *   success("Appointment booked!");
 */

import { createContext, useContext, useCallback } from "react";
import { ToastContainer, toast as _toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  success: (
    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  ),
};

// ─── Custom Toast Body ─────────────────────────────────────────────────────────
const ToastBody = ({ type, message }) => (
  <div className="flex items-start gap-3 py-0.5">
    <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
    <p className="text-sm text-slate-100 leading-snug">{message}</p>
  </div>
);

// ─── Base options ──────────────────────────────────────────────────────────────
const BASE_OPTIONS = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  transition: Slide,
  className:
    "!bg-slate-800 !border !border-slate-700 !shadow-xl !shadow-slate-950/50 !rounded-xl !p-4 !min-h-0",
  progressClassName: "!bg-cyan-500/60",
  bodyClassName: "!p-0 !m-0",
  closeButton: ({ closeToast }) => (
    <button onClick={closeToast} className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-700 flex-shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  ),
};

// ─── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const success = useCallback((message, options = {}) => {
    _toast(<ToastBody type="success" message={message} />, {
      ...BASE_OPTIONS,
      ...options,
      progressClassName: "!bg-emerald-500/70",
    });
  }, []);

  const error = useCallback((message, options = {}) => {
    _toast(<ToastBody type="error" message={message} />, {
      ...BASE_OPTIONS,
      autoClose: 5000,
      ...options,
      progressClassName: "!bg-red-500/70",
    });
  }, []);

  const info = useCallback((message, options = {}) => {
    _toast(<ToastBody type="info" message={message} />, {
      ...BASE_OPTIONS,
      ...options,
      progressClassName: "!bg-cyan-500/70",
    });
  }, []);

  const warning = useCallback((message, options = {}) => {
    _toast(<ToastBody type="warning" message={message} />, {
      ...BASE_OPTIONS,
      ...options,
      progressClassName: "!bg-amber-500/70",
    });
  }, []);

  /**
   * Promise toast — shows loading → success/error automatically
   * @param {Promise} promise
   * @param {{ loading, success, error }} messages
   */
  const promise = useCallback((promiseFn, messages) => {
    return _toast.promise(promiseFn, {
      pending: {
        render: () => (
          <div className="flex items-center gap-3 py-0.5">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-slate-300">{messages.loading || "Loading…"}</p>
          </div>
        ),
        ...BASE_OPTIONS,
      },
      success: {
        render: ({ data }) => (
          <ToastBody type="success" message={
            typeof messages.success === "function" ? messages.success(data) : messages.success || "Done!"
          } />
        ),
        ...BASE_OPTIONS,
        progressClassName: "!bg-emerald-500/70",
      },
      error: {
        render: ({ data }) => (
          <ToastBody type="error" message={
            typeof messages.error === "function" ? messages.error(data) : messages.error || "Something went wrong."
          } />
        ),
        ...BASE_OPTIONS,
        autoClose: 5000,
        progressClassName: "!bg-red-500/70",
      },
    });
  }, []);

  const dismiss = useCallback((id) => _toast.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ success, error, info, warning, promise, dismiss }}>
      {children}
      <ToastContainer
        position="top-right"
        newestOnTop
        limit={5}
        style={{ zIndex: 99999 }}
      />
    </ToastContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

export default ToastProvider;