import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/index";
import { useAuth } from "../../context/AuthContext";

// ─── Icons (inline SVG to avoid extra deps) ────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg className={`w-3.5 h-3.5 ${filled ? "text-amber-400" : "text-slate-600"}`} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111 5.428.79a.562.562 0 0 1 .316.96l-3.927 3.827.927 5.405a.562.562 0 0 1-.84.61L12 17.25l-4.867 2.56a.562.562 0 0 1-.84-.61l.927-5.405L3.16 10.36a.562.562 0 0 1 .316-.96l5.428-.79L11.48 3.5z" />
  </svg>
);
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M13 16h-2" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

// ─── Specialty list ────────────────────────────────────────────────────────────
const SPECIALTIES = [
  "All", "Cardiologist", "Dermatologist", "Neurologist", "Orthopedic",
  "Pediatrician", "Psychiatrist", "Gynecologist", "Oncologist", "General Physician",
];

// ─── Star Rating display ───────────────────────────────────────────────────────
const StarRating = ({ rating = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon key={n} filled={n <= Math.round(rating)} />
    ))}
    <span className="ml-1 text-xs text-slate-400">{rating?.toFixed(1) || "0.0"}</span>
  </div>
);

// ─── Doctor Card ───────────────────────────────────────────────────────────────
const DoctorCard = ({ doctor, onBook }) => {
  const [imgErr, setImgErr] = useState(false);
  const initials = doctor.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group relative bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-cyan-500/40 hover:bg-slate-800/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10">
      {/* Availability badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
          doctor.isActive
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${doctor.isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          {doctor.isActive ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Card body */}
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {doctor.profilePhoto && !imgErr ? (
              <img
                src={doctor.profilePhoto}
                alt={doctor.name}
                onError={() => setImgErr(true)}
                className="w-16 h-16 rounded-xl object-cover border-2 border-slate-600 group-hover:border-cyan-500/50 transition-colors"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-2 border-slate-600 group-hover:border-cyan-500/50 transition-colors flex items-center justify-center">
                <span className="text-lg font-bold text-cyan-300">{initials}</span>
              </div>
            )}
          </div>

          {/* Name & specialty */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
              Dr. {doctor.name}
            </h3>
            <p className="text-xs font-medium text-cyan-400 mt-0.5 truncate">{doctor.specialty}</p>
            <StarRating rating={doctor.rating} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Experience", value: `${doctor.experience || 0}y` },
            { label: "Patients", value: doctor.totalPatients || "0" },
            { label: "Fee", value: `₹${doctor.consultationFee || 0}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-700/50 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-white">{value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Hospital */}
        {doctor.hospital && (
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5 truncate">
            <span className="w-1 h-1 bg-cyan-500 rounded-full flex-shrink-0" />
            {doctor.hospital}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => onBook(doctor._id)}
          disabled={!doctor.isActive}
          className="w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-900 hover:border-cyan-500 active:scale-95"
        >
          {doctor.isActive ? "Book Appointment" : "Unavailable"}
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-16 h-16 rounded-xl bg-slate-700" />
      <div className="flex-1">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-1/3" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[1, 2, 3].map((n) => <div key={n} className="h-12 bg-slate-700 rounded-lg" />)}
    </div>
    <div className="h-10 bg-slate-700 rounded-xl" />
  </div>
);

// ─── Main Doctors Page ─────────────────────────────────────────────────────────
const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);

  const LIMIT = 12;

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: LIMIT,
        sort: sortBy,
        ...(search && { search }),
        ...(selectedSpecialty !== "All" && { specialty: selectedSpecialty }),
      };
      const { data } = await axios.get("/doctors", { params });
      setDoctors(data.doctors || data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalDoctors(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedSpecialty, sortBy]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedSpecialty, sortBy]);

  const handleBook = (doctorId) => {
    navigate(`/book-appointment/${doctorId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Title */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                Find a Doctor
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalDoctors > 0 ? `${totalDoctors} doctors available` : "Browse our specialists"}
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctors…"
                  className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-all ${
                  showFilters
                    ? "bg-cyan-500 border-cyan-500 text-slate-900"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50"
                }`}
              >
                <FilterIcon />
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              {/* Specialty filter */}
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Specialty</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSpecialty(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedSpecialty === s
                          ? "bg-cyan-500 text-slate-900"
                          : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="sm:w-44">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Sort by</p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                >
                  <option value="rating">Top Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="fee_asc">Fee: Low to High</option>
                  <option value="fee_desc">Fee: High to Low</option>
                  <option value="patients">Most Patients</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">Failed to load doctors</p>
              <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={fetchDoctors} className="ml-auto px-3 py-1.5 bg-red-500/20 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🩺</div>
            <p className="text-slate-300 font-medium text-lg">No doctors found</p>
            <p className="text-slate-500 text-sm mt-2">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => { setSearch(""); setSelectedSpecialty("All"); }}
              className="mt-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm hover:bg-cyan-500/20 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} onBook={handleBook} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:border-cyan-500/50 transition-all"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                  page === p
                    ? "bg-cyan-500 text-slate-900"
                    : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500/50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:border-cyan-500/50 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;