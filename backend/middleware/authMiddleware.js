const jwt = require("jsonwebtoken");
//const asyncHandler = require("express-async-handler");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware: Protect route — requires valid JWT
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      if (!req.user.isActive) {
        res.status(403);
        throw new Error("Account is deactivated. Contact admin.");
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized — invalid token");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }
});

/**
 * Middleware Factory: Restrict access to specific roles
 * Usage: authorize("admin", "doctor")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied. Role '${req.user.role}' is not authorized for this action.`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };