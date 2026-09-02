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
    ...(req.query.userId ? { userId: String(req.query.userId) } : {}),
    ...(req.query.statusCode ? { statusCode: Number(req.query.statusCode) } : {}),
    ...(req.query.method ? { method: String(req.query.method).toUpperCase() } : {}),
    ...(req.query.search
      ? { url: { contains: String(req.query.search), mode: "insensitive" } }
      : {}),
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

  // Fetch endpoint telemetry stats for this specific URL
  const endpointStats = await prisma.requestLog.aggregate({
    _count: { _all: true },
    _avg: { responseTime: true },
    _max: { responseTime: true },
    where: { url: log.url },
  });

  ApiResponse.success(res, 200, "Request log fetched", {
    log,
    endpointStats: {
      url: log.url,
      totalInvocations: endpointStats._count._all,
      avgLatencyMs: Math.round(endpointStats._avg.responseTime ?? 0),
      maxLatencyMs: Math.round(endpointStats._max.responseTime ?? 0),
    },
  });
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalRequests,
    successRequests,
    errorRequests,
    clientErrorRequests,
    serverErrorRequests,
    latencyAgg,
    countsByMethod,
    topSlowEndpoints,
    topActiveIps,
  ] = await Promise.all([
    prisma.requestLog.count({ where: { createdAt: { gte: since } } }),
    prisma.requestLog.count({
      where: { createdAt: { gte: since }, isSuccess: true },
    }),
    prisma.requestLog.count({
      where: { createdAt: { gte: since }, isSuccess: false },
    }),
    prisma.requestLog.count({
      where: { createdAt: { gte: since }, statusCode: { gte: 400, lt: 500 } },
    }),
    prisma.requestLog.count({
      where: { createdAt: { gte: since }, statusCode: { gte: 500 } },
    }),
    prisma.requestLog.aggregate({
      _avg: { responseTime: true },
      _max: { responseTime: true },
      _min: { responseTime: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.requestLog.groupBy({
      by: ["method"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.requestLog.groupBy({
      by: ["url"],
      _avg: { responseTime: true },
      _count: { _all: true },
      where: { createdAt: { gte: since } },
      orderBy: {
        _avg: {
          responseTime: "desc",
        },
      },
      take: 5,
    }),
    prisma.requestLog.groupBy({
      by: ["ipAddress"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
      orderBy: {
        _count: {
          ipAddress: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const successRate = totalRequests > 0 ? Math.round((successRequests / totalRequests) * 1000) / 10 : 0;
  const errorRate = totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 1000) / 10 : 0;

  ApiResponse.success(res, 200, "Advanced request analytics fetched", {
    period: "last_24h",
    totalRequests,
    successRequests,
    errorRequests,
    clientErrorRequests,
    serverErrorRequests,
    successRate,
    errorRate,
    avgResponseTimeMs: Math.round(latencyAgg._avg.responseTime ?? 0),
    maxResponseTimeMs: Math.round(latencyAgg._max.responseTime ?? 0),
    minResponseTimeMs: Math.round(latencyAgg._min.responseTime ?? 0),
    countsByMethod: countsByMethod.map((c) => ({
      method: c.method,
      count: c._count._all,
    })),
    topSlowEndpoints: topSlowEndpoints.map((e) => ({
      url: e.url,
      avgLatencyMs: Math.round(e._avg.responseTime ?? 0),
      count: e._count._all,
    })),
    topActiveIps: topActiveIps.map((i) => ({
      ipAddress: i.ipAddress || "Internal",
      count: i._count._all,
    })),
    statusDistribution: {
      status2xx: successRequests,
      status3xx: 0,
      status4xx: clientErrorRequests,
      status5xx: serverErrorRequests,
    },
  });
});
