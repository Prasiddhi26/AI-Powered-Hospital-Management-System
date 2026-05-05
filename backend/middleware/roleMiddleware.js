/**
 * roleMiddleware.js
 * Role-based access control middleware
 * Supports: patient | doctor | admin
 * Must be used AFTER authMiddleware (req.user must be set)
 */

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in first.",
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: [${allowedRoles.join(", ")}]. Your role: ${userRole}`,
      });
    }

    next();
  };
};

// Convenience role guards
const isAdmin = roleMiddleware("admin");
const isDoctor = roleMiddleware("doctor");
const isPatient = roleMiddleware("patient");
const isDoctorOrAdmin = roleMiddleware("doctor", "admin");
const isPatientOrAdmin = roleMiddleware("patient", "admin");
const isAnyRole = roleMiddleware("patient", "doctor", "admin");

module.exports = {
  roleMiddleware,
  isAdmin,
  isDoctor,
  isPatient,
  isDoctorOrAdmin,
  isPatientOrAdmin,
  isAnyRole,
};