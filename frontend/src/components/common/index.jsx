// ─── StatCard ────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color = "teal", trend }) => {
  const colorMap = {
    teal: "from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-white text-3xl font-display font-bold">{value}</p>
          {trend && <p className="text-slate-500 text-xs mt-1">{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center border`}>
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const config = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    rescheduled: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "no-show": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    low: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    emergency: "bg-red-700/30 text-red-300 border-red-500/50",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${config[status] || config.pending}`}>
      {status}
    </span>
  );
};

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const LoadingSpinner = ({ size = "md", text }) => {
  const sizeMap = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-16 h-16" };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizeMap[size]} border-4 border-teal-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
      <Icon className="text-slate-500 text-3xl" />
    </div>
    <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm max-w-sm">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-white font-display font-semibold text-xl">{title}</h2>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = "", hover = false }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-2xl ${hover ? "hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-200 cursor-pointer" : ""} ${className}`}>
    {children}
  </div>
);

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = "primary", size = "md", loading, disabled, className = "", ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white shadow-lg shadow-teal-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
    outline: "border border-teal-500/50 text-teal-400 hover:bg-teal-500/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon className="text-base" />
        </div>
      )}
      <input
        className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50
          ${Icon ? "pl-10" : ""}
          ${error ? "border-red-500/60 focus:border-red-500" : "border-slate-700 focus:border-teal-500/50"}`}
        {...props}
      />
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// ─── Select ────────────────────────────────────────────────────────────────────
export const Select = ({ label, error, options = [], ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <select
      className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50
        ${error ? "border-red-500/60" : "border-slate-700 focus:border-teal-500/50"}`}
      {...props}
    >
      {options.map(({ value, label: optLabel }) => (
        <option key={value} value={value}>{optLabel}</option>
      ))}
    </select>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, rows = 3, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <textarea
      rows={rows}
      className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50 resize-none
        ${error ? "border-red-500/60" : "border-slate-700 focus:border-teal-500/50"}`}
      {...props}
    />
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// ─── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = "md" }) => {
  const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : name?.charAt(0)?.toUpperCase()}
    </div>
  );
};