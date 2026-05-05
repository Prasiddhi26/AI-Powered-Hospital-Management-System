/**
 * asyncHandler.js
 * Wraps async Express route handlers to cleanly forward errors to errorMiddleware
 * Eliminates try/catch boilerplate from every controller
 *
 * Usage:
 *   const asyncHandler = require("../utils/asyncHandler");
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */

/**
 * Wraps an async function and passes any rejected promise to next()
 * @param {Function} fn - async (req, res, next) => {}
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

