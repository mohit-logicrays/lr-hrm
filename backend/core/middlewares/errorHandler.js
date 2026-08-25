import mongoose from "mongoose";
import { AppException } from "../exceptions/appExceptions.js";
import { sendError } from "../responses/apiResponse.js";

/** 404 for unmatched routes */
export function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/** Centralized error handler — converts exceptions to consistent responses */
export function errorHandler(err, req, res, next) {
  // Known operational exceptions
  if (err instanceof AppException) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      details: err.details,
    });
  }

  // Zod validation errors → 400 with field details
  if (err.name === "ZodError") {
    return sendError(res, {
      statusCode: 400,
      message: "Validation failed",
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Mongoose validation errors → 400
  if (err instanceof mongoose.Error.ValidationError) {
    return sendError(res, {
      statusCode: 400,
      message: "Validation failed",
      details: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Mongoose duplicate key → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, {
      statusCode: 409,
      message: `A record with this ${field} already exists`,
    });
  }

  // Mongoose cast error (bad ObjectId) → 400
  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid value for ${err.path}`,
    });
  }

  console.error("[Unhandled Error]", err);
  return sendError(res, {
    statusCode: err.status || 500,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
