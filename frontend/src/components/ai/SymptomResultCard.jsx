import { useEffect, useRef } from "react";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  UserGroupIcon,
  SparklesIcon,
  HeartIcon,
  ClockIcon,
  InformationCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// ────────────────────────────────────────────────────────────
// Urgency config helper
// ────────────────────────────────────────────────────────────
const URGENCY_CONFIG = {
  low: {
    label: "Low Urgency",
    sublabel: "Non-urgent — Schedule when convenient",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    ring: "ring-emerald-500/20",
    icon: ShieldCheckIcon,
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
    pulse: "bg-emerald-400",
  },
  medium: {
    label: "Medium Urgency",
    sublabel: "Seek care within 24–48 hours",
    color: "amber",
    gradient: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    glow: "shadow-amber-500/10",
    ring: "ring-amber-500/20",
    icon: ExclamationTriangleIcon,
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    pulse: "bg-amber-400",
  },
  high: {
    label: "High Urgency",
    sublabel: "Seek immediate medical attention",
    color: "red",
    gradient: "from-red-500/20 to-red-600/5",
    border: "border-red-500/30",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    glow: "shadow-red-500/10",
    ring: "ring-red-500/20",
    icon: ShieldExclamationIcon,
    dot: "bg-red-400",
    bar: "bg-red-400",
    pulse: "bg-red-400",
  },
};

const URGENCY_BAR_WIDTH = { low: "33%", medium: "66%", high: "100%" };

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function UrgencyBadge({ level, config }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
}

function UrgencyBar({ level, config }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-400 font-medium">Urgency Level</span>
        <span className={`text-xs font-bold text-${config.color}-400`}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${config.bar}`}
          style={{ width: URGENCY_BAR_WIDTH[level] }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, label, value, color = "slate" }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
      <div className={`p-2 rounded-lg bg-${color}-500/10 mt-0.5 shrink-0`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main SymptomResultCard Component
// ────────────────────────────────────────────────────────────

/**
 * Props:
 * - result: {
 *     condition: string           — e.g. "Viral Upper Respiratory Infection"
 *     urgency: "low"|"medium"|"high"
 *     specialization: string      — e.g. "General Physician"
 *     description?: string        — brief explanation
 *     recommendations?: string[]  — list of advice
 *     confidence?: number         — 0–100
 *     symptoms?: string[]         — symptoms passed in
 *   }
 * - onBookDoctor?: () => void
 * - onReset?: () => void
 * - className?: string
 */
export default function SymptomResultCard({
  result,
  onBookDoctor,
  onReset,
  className = "",
}) {
  const cardRef = useRef(null);

  // Guard
  if (!result) return null;

  const {
    condition = "Unknown Condition",
    urgency = "low",
    specialization = "General Physician",
    description = "",
    recommendations = [],
    confidence = null,
    symptoms = [],
  } = result;

  const cfg = URGENCY_CONFIG[urgency?.toLowerCase()] || URGENCY_CONFIG.low;
  const UrgencyIcon = cfg.icon;

  // Animate in on mount
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.opacity = "0";
      cardRef.current.style.transform = "translateY(16px)";
      requestAnimationFrame(() => {
        cardRef.current.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        cardRef.current.style.opacity = "1";
        cardRef.current.style.transform = "translateY(0)";
      });
    }
  }, [result]);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl border bg-slate-900 ${cfg.border} shadow-xl ${cfg.glow} ${className}`}
    >
      {/* Gradient background overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} pointer-events-none`}
      />

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${cfg.color}-400 to-transparent opacity-60`} />

      <div className="relative z-10 p-5 md:p-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl bg-${cfg.color}-500/10 border ${cfg.border} shrink-0 mt-0.5`}>
              <SparklesIcon className={`w-5 h-5 text-${cfg.color}-400`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">
                AI Analysis Result
              </p>
              <h2 className="text-lg font-bold text-white leading-tight">{condition}</h2>
              {confidence !== null && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {confidence}% confidence
                </p>
              )}
            </div>
          </div>
          <UrgencyBadge level={urgency} config={cfg} />
        </div>

        {/* Description */}
        {description && (
          <div className="flex gap-2.5 p-3.5 bg-slate-800/40 border border-slate-700/30 rounded-xl mb-5">
            <InformationCircleIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <InfoPill
            icon={UrgencyIcon}
            label="Urgency"
            value={cfg.sublabel}
            color={cfg.color}
          />
          <InfoPill
            icon={UserGroupIcon}
            label="Recommended Specialist"
            value={specialization}
            color="cyan"
          />
        </div>

        {/* Urgency Bar */}
        <UrgencyBar level={urgency?.toLowerCase()} config={cfg} />

        {/* Symptoms Detected */}
        {symptoms.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Symptoms Analyzed
            </p>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Recommendations
            </p>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0 mt-1.5`} />
                  <span className="text-sm text-slate-300 leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex gap-2 mt-5 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
          <ExclamationTriangleIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This is an AI-generated assessment and not a medical diagnosis. Always consult a
            qualified healthcare professional for accurate diagnosis and treatment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          {onBookDoctor && (
            <button
              onClick={onBookDoctor}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <UserGroupIcon className="w-4 h-4" />
              Book a {specialization}
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium rounded-xl text-sm transition-all duration-200"
            >
              Check Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Loading skeleton for when AI is thinking
// ────────────────────────────────────────────────────────────
export function SymptomResultSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 p-5 md:p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl" />
          <div>
            <div className="h-3 bg-slate-800 rounded w-24 mb-2" />
            <div className="h-5 bg-slate-700 rounded w-48 mb-1" />
            <div className="h-3 bg-slate-800 rounded w-20" />
          </div>
        </div>
        <div className="h-6 bg-slate-800 rounded-full w-24" />
      </div>
      <div className="h-16 bg-slate-800/50 rounded-xl mb-5" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="h-16 bg-slate-800/50 rounded-xl" />
        <div className="h-16 bg-slate-800/50 rounded-xl" />
      </div>
      <div className="h-10 bg-slate-800/30 rounded-xl mb-4" />
      <div className="flex gap-3">
        <div className="flex-1 h-12 bg-slate-800 rounded-xl" />
        <div className="h-12 w-28 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Compact inline variant for lists / sidebars
// ────────────────────────────────────────────────────────────
export function SymptomResultMini({ result, onClick }) {
  if (!result) return null;
  const cfg = URGENCY_CONFIG[result.urgency?.toLowerCase()] || URGENCY_CONFIG.low;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 bg-slate-900 border ${cfg.border} rounded-xl hover:bg-slate-800/70 transition-all duration-200 group`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{result.condition}</p>
          <p className="text-xs text-slate-400 mt-0.5">{result.specialization}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UrgencyBadge level={result.urgency} config={cfg} />
          <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>
    </button>
  );
}