/**
 * Loader.jsx
 * ----------
 * Reusable loading components.
 *
 * Exports:
 *   default  Loader         → full-page centered spinner
 *   named    LoaderInline   → small inline spinner (inside buttons etc.)
 *   named    LoaderOverlay  → full-screen blocking overlay
 *   named    LoaderDots     → animated 3-dot pulse
 *   named    LoaderCard     → skeleton card placeholder
 */

// ── Full-page Loader ──────────────────────────────────────────────────────────
/**
 * Props:
 *   message?  - string shown below spinner
 *   fullPage? - bool (default true) centers in full viewport
 */
export default function Loader({ message = "Loading...", fullPage = true }) {
  const wrapper = fullPage
    ? "min-h-screen flex items-center justify-center bg-slate-950"
    : "flex items-center justify-center py-20";

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm text-slate-400 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

// ── Core Spinner SVG ──────────────────────────────────────────────────────────
const SIZES = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
  xl: "w-14 h-14",
};

export function Spinner({ size = "md", className = "" }) {
  return (
    <svg
      className={`animate-spin text-cyan-400 ${SIZES[size] || SIZES.md} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ── Inline Loader (inside buttons) ───────────────────────────────────────────
/**
 * Props:
 *   label? - string shown next to spinner
 *   size?  - "sm" | "md"
 */
export function LoaderInline({ label, size = "sm" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size={size} />
      {label && <span>{label}</span>}
    </span>
  );
}

// ── Full-screen blocking Overlay ─────────────────────────────────────────────
/**
 * Props:
 *   message? - string
 */
export function LoaderOverlay({ message = "Please wait..." }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-slate-700 rounded-2xl px-10 py-8 shadow-2xl">
        <Spinner size="lg" />
        <p className="text-sm text-slate-300 font-medium">{message}</p>
      </div>
    </div>
  );
}

// ── Animated 3-dot Loader ────────────────────────────────────────────────────
export function LoaderDots({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-slate-400">{label}</span>}
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
/**
 * Props:
 *   lines?  - number of skeleton text lines (default 3)
 *   avatar? - bool (show avatar circle, default false)
 */
export function LoaderCard({ lines = 3, avatar = false }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        {avatar && (
          <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-700/60 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-700/40 rounded"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Skeleton Grid (multiple cards) ───────────────────────────────────────────
/**
 * Props:
 *   count?  - number of skeleton cards (default 6)
 *   avatar? - bool
 *   lines?  - lines per card
 */
export function LoaderGrid({ count = 6, avatar = false, lines = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <LoaderCard key={i} avatar={avatar} lines={lines} />
      ))}
    </div>
  );
}