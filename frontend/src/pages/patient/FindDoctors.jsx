import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiFilter, FiX, FiSliders } from "react-icons/fi";
import { doctorAPI } from "../../api";
import DoctorCard from "../../components/doctor/DoctorCard";
import { LoadingSpinner, EmptyState, Button } from "../../components/common";
import { toast } from "react-toastify";

const SPECIALIZATIONS = [
  "All", "General Physician", "Cardiologist", "Dermatologist", "Neurologist",
  "Orthopedist", "Gastroenterologist", "Pulmonologist", "ENT Specialist",
  "Ophthalmologist", "Gynecologist", "Pediatrician", "Psychiatrist",
  "Urologist", "Endocrinologist", "Oncologist",
];

const FindDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [minExp, setMinExp] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
        ...(search && { search }),
        ...(selectedSpec !== "All" && { specialization: selectedSpec }),
        ...(minExp && { minExperience: minExp }),
        ...(maxFee && { maxFee }),
      };
      const { data } = await doctorAPI.getAll(params);
      setDoctors(data.doctors || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpec, minExp, maxFee, page]);

  useEffect(() => {
    const timer = setTimeout(fetchDoctors, 400);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  const clearFilters = () => {
    setSearch("");
    setSelectedSpec("All");
    setMinExp("");
    setMaxFee("");
    setPage(1);
  };

  const hasActiveFilters = search || selectedSpec !== "All" || minExp || maxFee;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-white text-2xl lg:text-3xl">Find a Doctor</h1>
        <p className="text-slate-400 text-sm mt-1">
          Browse {total} verified specialists and book an appointment
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by doctor name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <FiX />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "primary" : "secondary"}
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto"
        >
          <FiSliders /> Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-teal-400 text-slate-900 rounded-full text-xs font-bold flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Min Experience (yrs)</label>
              <input
                type="number" min="0" max="50"
                value={minExp}
                onChange={(e) => { setMinExp(e.target.value); setPage(1); }}
                placeholder="e.g. 5"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Max Fee (₹)</label>
              <input
                type="number" min="0"
                value={maxFee}
                onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
                placeholder="e.g. 1000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-400 hover:bg-red-500/10">
                  <FiX /> Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specialization Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPECIALIZATIONS.map((spec) => (
          <button
            key={spec}
            onClick={() => { setSelectedSpec(spec); setPage(1); }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all flex-shrink-0
              ${selectedSpec === spec
                ? "bg-teal-500/20 text-teal-400 border-teal-500/50"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white"
              }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner text="Finding doctors..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="No doctors found"
          description="Try adjusting your search terms or removing filters"
          action={hasActiveFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              <FiX /> Clear Filters
            </Button>
          )}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <DoctorCard key={doc._id} doctor={doc} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-slate-400 text-sm px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FindDoctors;