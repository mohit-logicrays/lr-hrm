import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeaveRequestInput,
  AllocateLeaveInput,
} from "./leave.schema";

function normalizeDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function workingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const cur = normalizeDate(start);
  const last = normalizeDate(end);
  while (cur <= last) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const leaveTypeSelect = {
  id: true,
  name: true,
  code: true,
  maxDaysPerYear: true,
  isPaid: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LeaveTypeSelect;

const leaveRequestSelect = {
  id: true,
  userId: true,
  leaveTypeId: true,
  startDate: true,
  endDate: true,
  days: true,
  reason: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  leaveType: { select: { id: true, name: true, code: true, isPaid: true } },
} satisfies Prisma.LeaveRequestSelect;

export class LeaveService {
  // ---------- Leave Types ----------
  async listTypes(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where: Prisma.LeaveTypeWhereInput = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { code: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {};
    const [total, data] = await Promise.all([
      prisma.leaveType.count({ where }),
      prisma.leaveType.findMany({
        where,
        select: leaveTypeSelect,
        orderBy: { createdAt: "desc" },
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

  async createType(data: CreateLeaveTypeInput) {
    const existing = await prisma.leaveType.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError(409, "Leave type with this code already exists");
    return prisma.leaveType.create({ data, select: leaveTypeSelect });
  }

  async updateType(id: string, data: UpdateLeaveTypeInput) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Leave type not found");
    return prisma.leaveType.update({ where: { id }, data, select: leaveTypeSelect });
  }

  async removeType(id: string) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Leave type not found");
    await prisma.leaveType.delete({ where: { id } });
  }

  // ---------- Balances ----------
  async getBalance(userId: string, year?: number) {
    const y = year ?? new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: { userId, year: y },
      include: { leaveType: true },
    });
    return { year: y, balances };
  }

  async allocateBalance(data: AllocateLeaveInput) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new AppError(404, "User not found");
    const type = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!type) throw new AppError(404, "Leave type not found");

    return prisma.leaveBalance.upsert({
      where: {
        userId_leaveTypeId_year: {
          userId: data.userId,
          leaveTypeId: data.leaveTypeId,
          year: data.year,
        },
      },
      update: { allocated: data.allocated },
      create: {
        userId: data.userId,
        leaveTypeId: data.leaveTypeId,
        year: data.year,
        allocated: data.allocated,
        used: 0,
      },
    });
  }

  // ---------- Leave Requests ----------
  async listRequests(params: {
    page?: number;
    limit?: number;
    userId?: string;
    leaveTypeId?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where: Prisma.LeaveRequestWhereInput = {
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.leaveTypeId ? { leaveTypeId: params.leaveTypeId } : {}),
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.from || params.to
        ? {
            startDate: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
    };
    const [total, data] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        select: leaveRequestSelect,
        orderBy: { createdAt: "desc" },
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

  async myRequests(userId: string, params: { page?: number; limit?: number }) {
    return this.listRequests({ ...params, userId });
  }

  async createRequest(userId: string, data: CreateLeaveRequestInput) {
    const type = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!type) throw new AppError(404, "Leave type not found");

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate < startDate) {
      throw new AppError(400, "End date must be on or after start date");
    }

    const days = workingDaysBetween(startDate, endDate);
    if (days <= 0) {
      throw new AppError(400, "No working days in the selected range");
    }

    if (type.maxDaysPerYear && days > type.maxDaysPerYear) {
      throw new AppError(400, `Leave type allows a maximum of ${type.maxDaysPerYear} days`);
    }

    // Check for overlap with existing requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
        ],
      },
      select: { id: true, startDate: true, endDate: true },
    });
    if (overlapping) {
      throw new AppError(
        409,
        "Leave request overlaps with an existing pending or approved request",
        { conflictingId: overlapping.id }
      );
    }

    // Ensure the user has a balance record for this year
    const year = startDate.getFullYear();
    await prisma.leaveBalance.upsert({
      where: {
        userId_leaveTypeId_year: { userId, leaveTypeId: data.leaveTypeId, year },
      },
      update: {},
      create: { userId, leaveTypeId: data.leaveTypeId, year, allocated: 0, used: 0 },
    });

    return prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        days,
        reason: data.reason ?? null,
        status: "PENDING",
      },
      select: leaveRequestSelect,
    });
  }

  async approve(id: string, approvedBy: string, status: "APPROVED" | "REJECTED") {
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Leave request not found");
    if (existing.status !== "PENDING") {
      throw new AppError(400, `Leave request already ${existing.status.toLowerCase()}`);
    }

    // For approval, verify balance is sufficient and consume it
    if (status === "APPROVED") {
      const year = existing.startDate.getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: existing.userId,
            leaveTypeId: existing.leaveTypeId,
            year,
          },
        },
      });

      if (!balance) {
        throw new AppError(400, "User has no leave balance record for this year");
      }

      const remaining = balance.allocated - balance.used;
      if (existing.days > remaining) {
        throw new AppError(
          400,
          `Insufficient leave balance. Available: ${remaining} days, requested: ${existing.days} days`
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.leaveRequest.update({
          where: { id },
          data: { status, approvedBy, approvedAt: new Date() },
        });
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { used: { increment: existing.days } },
        });
      });
    } else {
      await prisma.leaveRequest.update({
        where: { id },
        data: { status, approvedBy, approvedAt: new Date() },
      });
    }

    return prisma.leaveRequest.findUnique({ where: { id }, select: leaveRequestSelect });
  }

  async cancel(userId: string, id: string) {
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Leave request not found");
    if (existing.userId !== userId) {
      throw new AppError(403, "You can only cancel your own leave requests");
    }
    if (existing.status !== "PENDING") {
      throw new AppError(400, "Only pending requests can be cancelled");
    }

    return prisma.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED", cancelledBy: userId },
      select: leaveRequestSelect,
    });
  }
}

export const leaveService = new LeaveService();
