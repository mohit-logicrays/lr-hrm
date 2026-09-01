import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateTimeLogInput,
  UpdateTimeLogInput,
} from "./time.schema";

const timeLogSelect = {
  id: true,
  userId: true,
  projectId: true,
  date: true,
  startTime: true,
  endTime: true,
  durationMin: true,
  description: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  project: { select: { id: true, name: true, code: true } },
} satisfies Prisma.TimeLogSelect;

export class TimeService {
  private duration(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  }

  async list(params: {
    page?: number;
    limit?: number;
    userId?: string;
    projectId?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.TimeLogWhereInput = {
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.projectId ? { projectId: params.projectId } : {}),
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.from || params.to
        ? {
            date: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.timeLog.count({ where }),
      prisma.timeLog.findMany({
        where,
        select: timeLogSelect,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async myLogs(userId: string, params: { page?: number; limit?: number; from?: string; to?: string }) {
    return this.list({ ...params, userId });
  }

  async getById(id: string) {
    const log = await prisma.timeLog.findUnique({ where: { id }, select: timeLogSelect });
    if (!log) throw new AppError(404, "Time log not found");
    return log;
  }

  async create(userId: string, data: CreateTimeLogInput) {
    if (data.projectId) {
      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!project) throw new AppError(404, "Project not found");
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Overlap prevention: no two time logs for this user may overlap
    const overlapping = await prisma.timeLog.findFirst({
      where: {
        userId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: { id: true, startTime: true, endTime: true },
    });

    if (overlapping) {
      throw new AppError(
        409,
        "Time log overlaps with an existing entry",
        { conflictingId: overlapping.id }
      );
    }

    const durationMin = this.duration(startTime, endTime);

    return prisma.timeLog.create({
      data: {
        userId,
        projectId: data.projectId ?? null,
        date: new Date(data.date || data.startTime),
        startTime,
        endTime,
        durationMin,
        description: data.description ?? null,
        status: "PENDING",
      },
      select: timeLogSelect,
    });
  }

  async update(id: string, user: { id: string; roleName: string }, data: UpdateTimeLogInput) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Time log not found");

    const canEditOthers = user.roleName === "superadmin" || user.roleName === "hr" || user.roleName === "manager";
    if (existing.userId !== user.id && !canEditOthers) {
      throw new AppError(403, "You cannot edit another user's time log");
    }

    let startTime = existing.startTime;
    let endTime = existing.endTime;
    if (data.startTime || data.endTime) {
      startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
      endTime = data.endTime ? new Date(data.endTime) : existing.endTime;
    }

    if (data.status && existing.status === "APPROVED") {
      throw new AppError(400, "Cannot change an already-approved time log");
    }

    const durationMin = this.duration(startTime, endTime);

    return prisma.timeLog.update({
      where: { id },
      data: {
        projectId: data.projectId,
        date: data.date ? new Date(data.date) : existing.date,
        startTime,
        endTime,
        durationMin,
        description: data.description,
        status: data.status ?? existing.status,
      },
      select: timeLogSelect,
    });
  }

  async approve(
    id: string,
    approvedBy: string,
    status: "APPROVED" | "REJECTED"
  ) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Time log not found");
    if (existing.status !== "PENDING") {
      throw new AppError(400, `Time log already ${existing.status.toLowerCase()}`);
    }

    return prisma.timeLog.update({
      where: { id },
      data: { status, approvedBy, approvedAt: new Date() },
      select: timeLogSelect,
    });
  }

  async remove(id: string, user: { id: string; permissions: string[] }) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Time log not found");

    const canManage = user.permissions.includes("time:manage");
    if (existing.userId !== user.id && !canManage) {
      throw new AppError(403, "You cannot delete another user's time log");
    }

    if (existing.status === "APPROVED" && !canManage) {
      throw new AppError(400, "Approved time logs cannot be deleted");
    }

    await prisma.timeLog.delete({ where: { id } });
  }
}

export const timeService = new TimeService();
