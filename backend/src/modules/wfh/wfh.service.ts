import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { approvalEngine } from "./approval.engine";
import { notificationService } from "../notifications/notification.service";
import { calculateNetWorkingDays } from "../../utils/workingDays";
import type { CreateWFHInput } from "./wfh.schema";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  designation: true,
  department: { select: { id: true, name: true, code: true } },
  role: { select: { id: true, name: true, displayName: true } },
};

export class WFHService {
  async create(userId: string, input: CreateWFHInput) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (end < start) throw new AppError(400, "End date cannot be earlier than start date");

    const calculatedDays = await calculateNetWorkingDays(start, end);
    if (calculatedDays <= 0) {
      throw new AppError(400, "No working days in the selected range (weekends and company holidays excluded)");
    }

    const overlappingWFH = await prisma.wFHRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
      },
    });
    if (overlappingWFH) throw new AppError(409, "You already have an active/pending WFH request overlapping with these dates");

    const conflictingLeave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (conflictingLeave) throw new AppError(409, "You have an existing Leave application on these dates");

    const request = await prisma.wFHRequest.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        days: calculatedDays,
        reason: input.reason,
        attachmentUrl: input.attachmentUrl || null,
        status: "PENDING",
      },
      include: { user: { select: userSelect } },
    });

    await approvalEngine.recordLog("WFH", request.id, "SUBMITTED", userId, "WFH application submitted");

    const emp = await prisma.userCurrentEmployment.findUnique({
      where: { userId },
      select: { reportingManagerId: true, projectManagerId: true },
    });
    const hrUsers = await prisma.user.findMany({
      where: { deletedAt: null, role: { name: { in: ["hr", "superadmin"] } } },
      select: { id: true },
    });
    const targetApprovers = new Set<string>(hrUsers.map((u) => u.id));
    if (emp?.reportingManagerId) targetApprovers.add(emp.reportingManagerId);
    if (emp?.projectManagerId) targetApprovers.add(emp.projectManagerId);
    targetApprovers.delete(userId);

    const applicantName = `${request.user.firstName || ""} ${request.user.lastName || ""}`.trim() || request.user.email;
    await notificationService.createMany(Array.from(targetApprovers), {
      title: "New WFH Request",
      message: `${applicantName} requested WFH from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
      type: "wfh",
      referenceId: request.id,
      link: "/wfh/approvals",
    });
    return request;
  }

  async listMy(userId: string, page = 1, pageSize = 20, status?: string) {
    const where: any = { userId, ...(status && status !== "ALL" ? { status } : {}) };
    const [total, data] = await Promise.all([
      prisma.wFHRequest.count({ where }),
      prisma.wFHRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: userSelect }, approvedBy: { select: userSelect } },
      }),
    ]);
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page * pageSize < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async listApprovals(approverId: string, approverRole: string, isSpecialRole = false, opts: { status?: string; search?: string; departmentId?: string }) {
    const supervisedUserIds = await approvalEngine.getSupervisedUserIds(approverId, approverRole, isSpecialRole);
    const where: any = {
      ...(supervisedUserIds !== null ? { userId: { in: supervisedUserIds } } : {}),
      ...(opts.status && opts.status !== "ALL" ? { status: opts.status } : {}),
    };
    if (opts.departmentId && opts.departmentId !== "ALL") {
      where.user = { departmentId: opts.departmentId };
    }
    if (opts.search) {
      where.OR = [
        { reason: { contains: opts.search, mode: "insensitive" } },
        { user: { firstName: { contains: opts.search, mode: "insensitive" } } },
        { user: { lastName: { contains: opts.search, mode: "insensitive" } } },
        { user: { email: { contains: opts.search, mode: "insensitive" } } },
      ];
    }
    return prisma.wFHRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect }, approvedBy: { select: userSelect } },
    });
  }

  async approve(requestId: string, approverId: string, approverRole: string, isSpecialRole = false, comment?: string) {
    const request = await prisma.wFHRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: userSelect } },
    });
    if (!request) throw new AppError(404, "WFH Request not found");
    if (request.status !== "PENDING") throw new AppError(400, `Request is already ${request.status}`);

    const canApprove = await approvalEngine.canApproveUser(approverId, request.userId, approverRole, isSpecialRole);
    if (!canApprove) throw new AppError(403, "You do not have permission to approve WFH for this employee");

    const updated = await prisma.wFHRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
      include: { user: { select: userSelect }, approvedBy: { select: userSelect } },
    });

    await approvalEngine.recordLog("WFH", requestId, "APPROVED", approverId, comment || "Approved");
    const approver = await prisma.user.findUnique({ where: { id: approverId }, select: { firstName: true, lastName: true } });
    const approverName = `${approver?.firstName || ""} ${approver?.lastName || ""}`.trim() || "Manager";

    await notificationService.create({
      userId: request.userId,
      title: "WFH Approved",
      message: `Your WFH request has been approved by ${approverName}.`,
      type: "wfh",
      referenceId: requestId,
      link: "/wfh",
    });
    return updated;
  }

  async reject(requestId: string, approverId: string, approverRole: string, isSpecialRole = false, reason: string) {
    const request = await prisma.wFHRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: userSelect } },
    });
    if (!request) throw new AppError(404, "WFH Request not found");
    if (request.status !== "PENDING") throw new AppError(400, `Request is already ${request.status}`);

    const canApprove = await approvalEngine.canApproveUser(approverId, request.userId, approverRole, isSpecialRole);
    if (!canApprove) throw new AppError(403, "You do not have permission to reject WFH for this employee");

    const updated = await prisma.wFHRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", approvedById: approverId, approvedAt: new Date(), rejectionReason: reason },
      include: { user: { select: userSelect }, approvedBy: { select: userSelect } },
    });

    await approvalEngine.recordLog("WFH", requestId, "REJECTED", approverId, reason);
    const approver = await prisma.user.findUnique({ where: { id: approverId }, select: { firstName: true, lastName: true } });
    const approverName = `${approver?.firstName || ""} ${approver?.lastName || ""}`.trim() || "Manager";

    await notificationService.create({
      userId: request.userId,
      title: "WFH Rejected",
      message: `Your WFH request was rejected by ${approverName}. Reason: ${reason}`,
      type: "wfh",
      referenceId: requestId,
      link: "/wfh",
    });
    return updated;
  }

  async cancel(requestId: string, userId: string) {
    const request = await prisma.wFHRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError(404, "WFH Request not found");
    if (request.userId !== userId) throw new AppError(403, "Cannot cancel someone else request");
    if (request.status !== "PENDING") throw new AppError(400, "Only PENDING requests can be cancelled");

    const updated = await prisma.wFHRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });
    await approvalEngine.recordLog("WFH", requestId, "CANCELLED", userId, "Cancelled by employee");
    return updated;
  }

  async getLogs(requestId: string) {
    return approvalEngine.getLogs("WFH", requestId);
  }
}

export const wfhService = new WFHService();
