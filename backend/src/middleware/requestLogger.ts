import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordConfirm",
  "oldPassword",
  "newPassword",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : sanitize(v);
    }
    return out;
  }
  return value;
}

function getClientIp(req: Request): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const responseTime = Number((end - start) / BigInt(1e6));

    const safeBody = sanitize(req.body);
    const safeQuery = sanitize(req.query);

    const headers = {
      accept: req.headers.accept,
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
    };

    prisma.requestLog
      .create({
        data: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
          ipAddress: getClientIp(req),
          userAgent:
            typeof req.headers["user-agent"] === "string"
              ? req.headers["user-agent"].slice(0, 500)
              : undefined,
          userId: req.user?.id ?? null,
          requestBody: safeBody as never,
          queryParams: safeQuery as never,
          headers: headers as never,
          isSuccess: res.statusCode < 400,
          errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
          metadata: {
            contentLength: res.get("content-length") ?? undefined,
            requestedBy: req.user?.email ?? null,
          } as never,
        },
      })
      .catch(() => {
        /* never let logging break the request */
      });
  });

  next();
}
