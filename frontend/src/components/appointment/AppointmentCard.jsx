import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiChevronRight } from "react-icons/fi";
import { Avatar, StatusBadge, Button } from "../common";
import { format } from "date-fns";

const AppointmentCard = ({ appointment, onCancel }) => {
  const navigate = useNavigate();
  const { _id, doctor, patient, appointmentDate, slotTime, status, reason, type } = appointment;

  // Determine display person based on context (doctor field always populated)
  const displayPerson = doctor?.user;
  const displayRole = "Dr.";

  const typeConfig = {
    "in-person": { label: "In-Person", color: "text-teal-400" },
    video: { label: "Video Call", color: "text-blue-400" },
    phone: { label: "Phone", color: "text-purple-400" },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        {/* Doctor/Patient Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar src={displayPerson?.avatar} name={displayPerson?.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              {displayRole} {displayPerson?.name}
            </p>
            <p className="text-slate-500 text-xs truncate">{doctor?.specialization}</p>
            <p className={`text-xs mt-0.5 font-medium ${typeConfig[type]?.color || "text-slate-400"}`}>
              {typeConfig[type]?.label}
            </p>
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={status} />
      </div>

      {/* Date & Time */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <FiCalendar className="text-teal-500 flex-shrink-0" />
          <span>{appointmentDate ? format(new Date(appointmentDate), "MMM dd, yyyy") : "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <FiClock className="text-teal-500 flex-shrink-0" />
          <span>{slotTime?.startTime} – {slotTime?.endTime}</span>
        </div>
      </div>

      {/* Reason */}
      <p className="mt-3 text-slate-400 text-xs line-clamp-2 bg-slate-800/60 rounded-lg px-3 py-2">
        <span className="text-slate-500">Reason: </span>{reason}
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/${appointment.patient ? "patient" : "doctor"}/appointments/${_id}`)}
          className="text-xs"
        >
          View Details <FiChevronRight />
        </Button>
        {["pending", "confirmed"].includes(status) && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(_id)}
            className="text-red-400 hover:bg-red-500/10 text-xs ml-auto"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;