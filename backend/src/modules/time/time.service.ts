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
  taskId: true,
  date: true,
  startTime: true,
  endTime: true,
  hours: true,
  durationMin: true,
  isBillable: true,
  isOvertime: true,
  description: true,
  rejectionReason: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: { select: { id: true, name: true } },
    },
  },
  project: { select: { id: true, name: true, code: true } },
  task: { select: { id: true, title: true } },
} satisfies Prisma.TimeLogSelect;

export class TimeService {
  async list(params: {
    page?: number;
    limit?: number;
    userId?: string;
    projectId?: string;
    taskId?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.TimeLogWhereInput = {
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.projectId ? { projectId: params.projectId } : {}),
      ...(params.taskId ? { taskId: params.taskId } : {}),
      ...(params.status && params.status !== "ALL"
        ? { status: params.status as never }
        : {}),
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

  async myLogs(userId: string, params: { page?: number; limit?: number; from?: string; to?: string; status?: string }) {
    return this.list({ ...params, userId });
  }

  async mySummary(userId: string, from?: string, to?: string) {
    const where: Prisma.TimeLogWhereInput = {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const logs = await prisma.timeLog.findMany({
      where,
      select: {
        hours: true,
        isBillable: true,
        isOvertime: true,
        status: true,
      },
    });

    let totalHours = 0;
    let billableHours = 0;
    let pendingHours = 0;
    let overtimeHours = 0;

    for (const log of logs) {
      const h = log.hours || 0;
      totalHours += h;
      if (log.isBillable) billableHours += h;
      if (log.status === "SUBMITTED" || log.status === "PENDING") pendingHours += h;
      if (log.isOvertime) overtimeHours += h;
    }

    return {
      totalHours: Number(totalHours.toFixed(1)),
      billableHours: Number(billableHours.toFixed(1)),
      pendingHours: Number(pendingHours.toFixed(1)),
      overtimeHours: Number(overtimeHours.toFixed(1)),
      totalEntries: logs.length,
    };
  }

  async getById(id: string) {
    const log = await prisma.timeLog.findUnique({ where: { id }, select: timeLogSelect });
    if (!log) throw new AppError(404, "Time log entry not found");
    return log;
  }

  async create(userId: string, data: CreateTimeLogInput) {
    if (data.projectId) {
      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!project) throw new AppError(404, "Selected project not found");
    }

    if (data.taskId) {
      const task = await prisma.task.findUnique({ where: { id: data.taskId } });
      if (!task) throw new AppError(404, "Selected task not found");
    }

    const logDate = new Date(data.date);

    // Business rule: Overtime auto-calculated if hours > 8
    const isOvertime = data.isOvertime || data.hours > 8;

    return prisma.timeLog.create({
      data: {
        userId,
        projectId: data.projectId ?? null,
        taskId: data.taskId ?? null,
        date: logDate,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        hours: data.hours,
        durationMin: Math.round(data.hours * 60),
        isBillable: data.isBillable,
        isOvertime,
        description: data.description ?? null,
        status: (data.status as any) || "DRAFT",
      },
      select: timeLogSelect,
    });
  }

  async update(id: string, user: { id: string; roleName: string }, data: UpdateTimeLogInput) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Time log entry not found");

    const roleUpper = (user.roleName || "").toUpperCase();
    const canManageOthers = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes(roleUpper);

    if (existing.userId !== user.id && !canManageOthers) {
      throw new AppError(403, "You cannot edit another employee's time log");
    }

    // Business rule: Regular employees can only edit DRAFT or REJECTED logs
    if (!canManageOthers && existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      throw new AppError(400, "Only Draft or Rejected timesheets can be edited");
    }

    const hours = data.hours ?? existing.hours;
    const isOvertime = data.isOvertime ?? (hours > 8 || existing.isOvertime);

    return prisma.timeLog.update({
      where: { id },
      data: {
        projectId: data.projectId,
        taskId: data.taskId,
        date: data.date ? new Date(data.date) : existing.date,
        startTime: data.startTime ? new Date(data.startTime) : existing.startTime,
        endTime: data.endTime ? new Date(data.endTime) : existing.endTime,
        hours,
        durationMin: Math.round(hours * 60),
        isBillable: data.isBillable ?? existing.isBillable,
        isOvertime,
        description: data.description ?? existing.description,
        rejectionReason: data.rejectionReason ?? existing.rejectionReason,
        status: (data.status as any) ?? existing.status,
      },
      select: timeLogSelect,
    });
  }

  async submitWeek(userId: string, from?: string, to?: string) {
    const where: Prisma.TimeLogWhereInput = {
      userId,
      status: { in: ["DRAFT", "REJECTED"] as any },
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const count = await prisma.timeLog.count({ where });
    if (count === 0) {
      throw new AppError(400, "No draft or rejected time logs found to submit for this week");
    }

    await prisma.timeLog.updateMany({
      where,
      data: { status: "SUBMITTED" as any },
    });

    return { submittedCount: count };
  }

  async approve(id: string, approvedBy: string, status: "APPROVED" | "REJECTED", rejectionReason?: string | null) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Time log entry not found");

    return prisma.timeLog.update({
      where: { id },
      data: {
        status: status as any,
        rejectionReason: status === "REJECTED" ? rejectionReason ?? null : null,
        approvedBy,
        approvedAt: new Date(),
      },
      select: timeLogSelect,
    });
  }

  async bulkApprove(approvedBy: string, ids: string[], status: "APPROVED" | "REJECTED", rejectionReason?: string | null) {
    await prisma.timeLog.updateMany({
      where: { id: { in: ids } },
      data: {
        status: status as any,
        rejectionReason: status === "REJECTED" ? rejectionReason ?? null : null,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return { updatedCount: ids.length, status };
  }

  async remove(id: string, user: { id: string; roleName: string }) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Time log entry not found");

    const roleUpper = (user.roleName || "").toUpperCase();
    const canManageOthers = ["SUPERADMIN", "HR_ADMIN", "ADMIN"].includes(roleUpper);

    if (existing.userId !== user.id && !canManageOthers) {
      throw new AppError(403, "You cannot delete another employee's time log");
    }

    if (existing.status === "APPROVED" && !canManageOthers) {
      throw new AppError(400, "Approved time logs cannot be deleted");
    }

    await prisma.timeLog.delete({ where: { id } });
  }

  async getReports(from?: string, to?: string) {
    const where: Prisma.TimeLogWhereInput = {
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const logs = await prisma.timeLog.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 1. Hours per Project
    const projectMap: Record<string, { id: string; name: string; code: string; totalHours: number }> = {};
    let totalBillable = 0;
    let totalNonBillable = 0;

    // 2. Employee Utilization Breakdown
    const userMap: Record<string, { id: string; name: string; department: string; totalHours: number; billableHours: number }> = {};

    for (const l of logs) {
      const h = l.hours || 0;
      const projName = l.project ? l.project.name : "Unassigned";
      const projKey = l.project ? l.project.id : "unassigned";

      if (!projectMap[projKey]) {
        projectMap[projKey] = {
          id: projKey,
          name: projName,
          code: l.project?.code || "MISC",
          totalHours: 0,
        };
      }
      projectMap[projKey].totalHours += h;

      if (l.isBillable) totalBillable += h;
      else totalNonBillable += h;

      const userName = `${l.user.firstName || ""} ${l.user.lastName || ""}`.trim() || l.user.email;
      const deptName = l.user.department ? l.user.department.name : "General";

      if (!userMap[l.userId]) {
        userMap[l.userId] = {
          id: l.userId,
          name: userName,
          department: deptName,
          totalHours: 0,
          billableHours: 0,
        };
      }
      userMap[l.userId].totalHours += h;
      if (l.isBillable) userMap[l.userId].billableHours += h;
    }

    const hoursPerProject = Object.values(projectMap).map((p) => ({
      ...p,
      totalHours: Number(p.totalHours.toFixed(1)),
    }));

    const employeeUtilization = Object.values(userMap).map((u) => ({
      ...u,
      totalHours: Number(u.totalHours.toFixed(1)),
      billableHours: Number(u.billableHours.toFixed(1)),
      utilizationRate: u.totalHours > 0 ? Number(((u.billableHours / u.totalHours) * 100).toFixed(1)) : 0,
    }));

    return {
      hoursPerProject,
      billableRatio: {
        billableHours: Number(totalBillable.toFixed(1)),
        billablePercentage: totalBillable + totalNonBillable > 0
          ? Number(((totalBillable / (totalBillable + totalNonBillable)) * 100).toFixed(1))
          : 0,
      },
      employeeUtilization,
    };
  }

  // ---------- Active Timer Persistence (DB Sync) ----------
  async getActiveTimer(userId: string) {
    const timer = await prisma.activeTimer.findUnique({
      where: { userId },
    });
    if (!timer) return null;

    // If timer was running, calculate delta seconds elapsed on the server
    if (timer.isRunning && timer.lastStartedAt) {
      const deltaSecs = Math.floor((Date.now() - new Date(timer.lastStartedAt).getTime()) / 1000);
      const newElapsed = timer.elapsedSeconds + deltaSecs;
      const newRemaining = timer.mode === "countdown"
        ? Math.max(0, timer.targetSeconds - newElapsed)
        : timer.remainingSeconds;

      return {
        ...timer,
        elapsedSeconds: newElapsed,
        remainingSeconds: newRemaining,
      };
    }

    return timer;
  }

  async syncActiveTimer(userId: string, data: {
    projectId?: string | null;
    taskId?: string | null;
    description?: string | null;
    mode?: string;
    targetSeconds?: number;
    elapsedSeconds?: number;
    remainingSeconds?: number;
    isRunning: boolean;
  }) {
    return prisma.activeTimer.upsert({
      where: { userId },
      create: {
        userId,
        projectId: data.projectId,
        taskId: data.taskId,
        description: data.description,
        mode: data.mode || "countdown",
        targetSeconds: data.targetSeconds || 7200,
        elapsedSeconds: data.elapsedSeconds || 0,
        remainingSeconds: data.remainingSeconds || 7200,
        isRunning: data.isRunning,
        lastStartedAt: data.isRunning ? new Date() : null,
      },
      update: {
        projectId: data.projectId,
        taskId: data.taskId,
        description: data.description,
        mode: data.mode,
        targetSeconds: data.targetSeconds,
        elapsedSeconds: data.elapsedSeconds,
        remainingSeconds: data.remainingSeconds,
        isRunning: data.isRunning,
        lastStartedAt: data.isRunning ? new Date() : null,
      },
    });
  }

  async clearActiveTimer(userId: string) {
    return prisma.activeTimer.deleteMany({
      where: { userId },
    });
  }
}

export const timeService = new TimeService();

