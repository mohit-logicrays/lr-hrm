/**
 * Wraps async route handlers so thrown AppExceptions reach the
 * centralized error handler instead of crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
