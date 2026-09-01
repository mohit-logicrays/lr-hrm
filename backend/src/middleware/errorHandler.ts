import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { ApiResponse } from "../utils/ApiResponse";

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
      message = `A record with this ${target} already exists`;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else {
      message = "Database error";
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    statusCode === 500
  ) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
  }

  return ApiResponse.error(res, statusCode, message, details);
}
