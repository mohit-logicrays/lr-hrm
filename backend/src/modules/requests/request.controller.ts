import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

const logSelect = {
  id: true,
  method: true,
  url: true,
  statusCode: true,
  responseTime: true,
  ipAddress: true,
  userId: true,
  isSuccess: true,
  errorMessage: true,
  createdAt: true,
} satisfies Prisma.RequestLogSelect;

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const where: Prisma.RequestLogWhereInput = {
    ...(req.query.userId
      ? { userId: String(req.query.userId) }
      : {}),
    ...(req.query.statusCode
      ? { statusCode: Number(req.query.statusCode) }
      : {}),
    ...(req.query.method ? { method: String(req.query.method).toUpperCase() } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.requestLog.count({ where }),
    prisma.requestLog.findMany({
      where,
      select: logSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  ApiResponse.success(res, 200, "Request logs fetched", data, {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const log = await prisma.requestLog.findUnique({ where: { id: req.params.id } });
  if (!log) {
    ApiResponse.error(res, 404, "Request log not found");
    return;
  }
  ApiResponse.success(res, 200, "Request log fetched", log);
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalRequests, successRequests, errorRequests, avgResponseTime, countsByMethod] =
    await Promise.all([
      prisma.requestLog.count({ where: { createdAt: { gte: since } } }),
      prisma.requestLog.count({
        where: { createdAt: { gte: since }, isSuccess: true },
      }),
      prisma.requestLog.count({
        where: { createdAt: { gte: since }, isSuccess: false },
      }),
      prisma.requestLog.aggregate({
        _avg: { responseTime: true },
        where: { createdAt: { gte: since } },
      }),
      prisma.requestLog.groupBy({
        by: ["method"],
        _count: { _all: true },
        where: { createdAt: { gte: since } },
      }),
    ]);

  ApiResponse.success(res, 200, "Request analytics fetched", {
    period: "last_24h",
    totalRequests,
    successRequests,
    errorRequests,
    successRate: totalRequests > 0 ? Math.round((successRequests / totalRequests) * 1000) / 10 : 0,
    avgResponseTimeMs: Math.round(avgResponseTime._avg.responseTime ?? 0),
    countsByMethod,
  });
});
