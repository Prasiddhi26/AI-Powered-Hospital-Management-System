import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

/**
 * ErrorState.jsx
 * --------------
 * Reusable error UI component.
 *
 * Props:
 *   title?    - string  (default: "Something went wrong")
 *   message?  - string  (default: generic message)
 *   onRetry?  - fn      (shows retry button if provided)
 *   fullPage? - bool    (centers in full viewport if true)
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  fullPage = false,
}) {
  const wrapper = fullPage
    ? "min-h-screen flex items-center justify-center bg-slate-950 p-6"
    : "flex items-center justify-center py-20 px-6";

  return (
    <div className={wrapper}>
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">{message}</p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-white font-medium rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorInline
 * -----------
 * Compact inline error — use inside forms or cards.
 *
 * Props:
 *   message - string
 */
export function ErrorInline({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
      <ExclamationTriangleIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <p className="text-sm text-red-400 leading-relaxed">{message}</p>
    </div>
  );
}

/**
 * ErrorBanner
 * -----------
 * Full-width dismissible banner error — use at top of pages.
 *
 * Props:
 *   message   - string
 *   onDismiss - fn
 */
export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
      <div className="flex items-center gap-2.5">
        <ExclamationTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm text-red-400">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}