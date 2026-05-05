import React from "react";
import { useNavigate } from "react-router-dom";
import { FiStar, FiClock, FiMapPin, FiArrowRight } from "react-icons/fi";
import { Avatar, Button, StatusBadge } from "../common";

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();
  const { user, specialization, experience, averageRating, totalReviews, hospital, consultationFee, isAcceptingAppointments } = doctor;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-900/80 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar src={user?.avatar} name={user?.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base font-display">Dr. {user?.name}</h3>
            {isAcceptingAppointments ? (
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" title="Accepting appointments" />
            ) : (
              <span className="w-2 h-2 bg-red-400 rounded-full" title="Not accepting" />
            )}
          </div>
          <p className="text-teal-400 text-sm font-medium">{specialization}</p>
          {hospital && (
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              <FiMapPin className="text-xs" />
              <span>{hospital}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <FiStar className="text-amber-400 text-sm" />
          <span className="text-white font-semibold text-sm">{averageRating?.toFixed(1) || "—"}</span>
          <span className="text-slate-500 text-xs">({totalReviews})</span>
        </div>
        {/* Experience */}
        <div className="flex items-center gap-1.5">
          <FiClock className="text-blue-400 text-sm" />
          <span className="text-slate-300 text-sm">{experience} yrs exp</span>
        </div>
      </div>

      {/* Fee + Action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs">Consultation Fee</p>
          <p className="text-white font-bold text-lg">
            {consultationFee === 0 ? (
              <span className="text-teal-400">Free</span>
            ) : (
              `₹${consultationFee}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/patient/doctors/${doctor._id}`)}
          >
            View
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!isAcceptingAppointments}
            onClick={() => navigate(`/patient/book/${doctor._id}`)}
            className="group-hover:shadow-teal-500/30"
          >
            Book <FiArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;