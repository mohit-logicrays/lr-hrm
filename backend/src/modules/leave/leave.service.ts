import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { calculateNetWorkingDays } from "../../utils/workingDays";
import { approvalEngine } from "../wfh/approval.engine";
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeaveRequestInput,
  AllocateLeaveInput,
} from "./leave.schema";

function normalizeDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
  isHalfDay: true,
  halfDaySession: true,
  tlApprovalStatus: true,
  tlApprovedBy: true,
  tlApprovedAt: true,
  pmApprovalStatus: true,
  pmApprovedBy: true,
  pmApprovedAt: true,
  hrApprovalStatus: true,
  hrApprovedBy: true,
  hrApprovedAt: true,
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

  async createRequest(userId: string, data: CreateLeaveRequestInput, isHr = false) {
    const targetUser = data.targetUserId && isHr ? data.targetUserId : userId;
    const type = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!type) throw new AppError(404, "Leave type not found");

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = normalizeDate(new Date());

    if (endDate < startDate) {
      throw new AppError(400, "End date must be on or after start date");
    }

    // Past leave date restriction: Only HR can apply for leaves in the past
    if (!isHr && normalizeDate(startDate) < today) {
      throw new AppError(403, "You cannot apply for leaves in the past. Only HR can apply for past leaves.");
    }

    const days = data.isHalfDay ? 0.5 : await calculateNetWorkingDays(startDate, endDate);
    if (days <= 0) {
      throw new AppError(400, "No working days in the selected range (weekends and company holidays excluded)");
    }

    if (type.maxDaysPerYear && days > type.maxDaysPerYear) {
      throw new AppError(400, `Leave type allows a maximum of ${type.maxDaysPerYear} days`);
    }

    // Check for overlap with existing Leave
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        userId: targetUser,
        status: { in: ["PENDING", "APPROVED"] },
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
        ],
      },
      select: { id: true },
    });
    if (overlapping) {
      throw new AppError(409, "Leave request overlaps with an existing pending or approved leave request");
    }

    // Check for collision with existing WFH
    const overlappingWFH = await prisma.wFHRequest.findFirst({
      where: {
        userId: targetUser,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    });
    if (overlappingWFH) {
      throw new AppError(409, "Leave request collides with an active/pending Work From Home (WFH) application on these dates");
    }

    const year = startDate.getFullYear();
    await prisma.leaveBalance.upsert({
      where: {
        userId_leaveTypeId_year: { userId: targetUser, leaveTypeId: data.leaveTypeId, year },
      },
      update: {},
      create: { userId: targetUser, leaveTypeId: data.leaveTypeId, year, allocated: 0, used: 0 },
    });

    const created = await prisma.leaveRequest.create({
      data: {
        userId: targetUser,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        days,
        reason: data.reason ?? null,
        isHalfDay: Boolean(data.isHalfDay),
        halfDaySession: data.isHalfDay ? data.halfDaySession || "FIRST_HALF" : null,
        status: "PENDING",
      },
      select: leaveRequestSelect,
    });

    // Record initial submission log in approval timeline
    await approvalEngine.recordLog(
      "LEAVE",
      created.id,
      "SUBMITTED",
      userId,
      data.reason ? `Leave application submitted: ${data.reason}` : "Leave application submitted"
    );

    return created;
  }

  async approveStage(
    id: string,
    approvedBy: string,
    status: "APPROVED" | "REJECTED",
    approvalRole: "TL" | "PM" | "HR" = "HR",
    comment?: string | null
  ) {
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Leave request not found");
    if (existing.status !== "PENDING") {
      throw new AppError(400, `Leave request is already ${existing.status.toLowerCase()}`);
    }
    if (existing.userId === approvedBy) {
      throw new AppError(403, "You cannot approve or reject your own leave request");
    }

    const now = new Date();
    const updateData: Prisma.LeaveRequestUpdateInput = {};

    if (approvalRole === "TL") {
      updateData.tlApprovalStatus = status;
      updateData.tlApprovedBy = approvedBy;
      updateData.tlApprovedAt = now;
    } else if (approvalRole === "PM") {
      updateData.pmApprovalStatus = status;
      updateData.pmApprovedBy = approvedBy;
      updateData.pmApprovedAt = now;
    } else {
      updateData.hrApprovalStatus = status;
      updateData.hrApprovedBy = approvedBy;
      updateData.hrApprovedAt = now;
    }

    // Rejection by any stage rejects the leave request
    if (status === "REJECTED") {
      updateData.status = "REJECTED";
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = now;
      await prisma.leaveRequest.update({ where: { id }, data: updateData });

      // Record rejection log
      await approvalEngine.recordLog(
        "LEAVE",
        id,
        "REJECTED",
        approvedBy,
        comment || `${approvalRole} rejected the leave request`
      );
    } else {
      // HR approval or final stage approval completes the request
      const isFinalApproval =
        approvalRole === "HR" ||
        (approvalRole === "TL" && existing.pmApprovalStatus === "APPROVED" && existing.hrApprovalStatus === "APPROVED") ||
        (approvalRole === "PM" && existing.tlApprovalStatus === "APPROVED" && existing.hrApprovalStatus === "APPROVED");

      if (isFinalApproval) {
        updateData.status = "APPROVED";
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = now;

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

        if (balance) {
          await prisma.$transaction(async (tx) => {
            await tx.leaveRequest.update({ where: { id }, data: updateData });
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: { used: { increment: existing.days } },
            });
          });
        } else {
          await prisma.leaveRequest.update({ where: { id }, data: updateData });
        }
      } else {
        await prisma.leaveRequest.update({ where: { id }, data: updateData });
      }

      // Record approval stage log
      await approvalEngine.recordLog(
        "LEAVE",
        id,
        "APPROVED",
        approvedBy,
        comment || `${approvalRole} approval recorded${isFinalApproval ? " (Final Approval)" : ""}`
      );
    }

    return prisma.leaveRequest.findUnique({ where: { id }, select: leaveRequestSelect });
  }

  async updateRequest(id: string, isHr: boolean, data: { leaveTypeId?: string; startDate?: string; endDate?: string; reason?: string | null; isHalfDay?: boolean; halfDaySession?: string | null }) {
    if (!isHr) {
      throw new AppError(403, "Only HR administrators are authorized to edit leave request details.");
    }
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Leave request not found");

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;
    const isHalfDay = data.isHalfDay !== undefined ? data.isHalfDay : existing.isHalfDay;
    const days = isHalfDay ? 0.5 : await calculateNetWorkingDays(startDate, endDate);

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        ...(data.leaveTypeId ? { leaveTypeId: data.leaveTypeId } : {}),
        startDate,
        endDate,
        days,
        ...(data.reason !== undefined ? { reason: data.reason } : {}),
        isHalfDay,
        halfDaySession: isHalfDay ? (data.halfDaySession as any) || "FIRST_HALF" : null,
      },
      select: leaveRequestSelect,
    });
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

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED", cancelledBy: userId },
      select: leaveRequestSelect,
    });

    await approvalEngine.recordLog("LEAVE", id, "CANCELLED", userId, "Leave request cancelled by employee");

    return updated;
  }

  async getLogs(id: string) {
    return approvalEngine.getLogs("LEAVE", id);
  }
}

export const leaveService = new LeaveService();
