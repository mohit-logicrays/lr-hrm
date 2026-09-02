import { notificationService } from "./notification.service";
import { prisma } from "../../config/prisma";

export const NotificationEvents = {
  // Leaves
  async onLeaveApplied(leaveRequestId: string, employeeId: string, employeeName: string) {
    // Notify HR and Reporting Manager / TL
    const [hrUsers, emp] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          role: { name: { in: ["hr", "superadmin"] } },
        },
        select: { id: true },
      }),
      prisma.userCurrentEmployment.findUnique({
        where: { userId: employeeId },
        select: { reportingManagerId: true },
      }),
    ]);

    const targetUserIds = new Set<string>(hrUsers.map((u) => u.id));
    if (emp?.reportingManagerId) {
      targetUserIds.add(emp.reportingManagerId);
    }
    targetUserIds.delete(employeeId); // Avoid notifying self

    await notificationService.createMany(Array.from(targetUserIds), {
      title: "Leave Request Submitted",
      message: `${employeeName} applied for leave.`,
      type: "leave",
      referenceId: leaveRequestId,
      link: "/leave",
    });
  },

  async onLeaveStatusChanged(leaveRequestId: string, employeeId: string, status: string, approverName: string) {
    const isApproved = status.toUpperCase() === "APPROVED";
    await notificationService.create({
      userId: employeeId,
      title: isApproved ? "Leave Approved" : "Leave Rejected",
      message: `Your leave request has been ${status.toLowerCase()} by ${approverName}.`,
      type: "leave",
      referenceId: leaveRequestId,
      link: "/leave",
    });
  },

  // Timesheets
  async onTimesheetSubmitted(timeLogId: string, employeeId: string, employeeName: string, hours: number) {
    const [managers, emp] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          role: { name: { in: ["manager", "lead", "hr", "superadmin"] } },
        },
        select: { id: true },
      }),
      prisma.userCurrentEmployment.findUnique({
        where: { userId: employeeId },
        select: { reportingManagerId: true, projectManagerId: true },
      }),
    ]);

    const targetUserIds = new Set<string>();
    if (emp?.reportingManagerId) targetUserIds.add(emp.reportingManagerId);
    if (emp?.projectManagerId) targetUserIds.add(emp.projectManagerId);
    if (targetUserIds.size === 0) {
      managers.forEach((m) => targetUserIds.add(m.id));
    }
    targetUserIds.delete(employeeId);

    await notificationService.createMany(Array.from(targetUserIds), {
      title: "Timesheet Submitted",
      message: `${employeeName} submitted ${hours}h for review.`,
      type: "timesheet",
      referenceId: timeLogId,
      link: "/time",
    });
  },

  async onTimesheetApproved(employeeId: string, hours: number, approverName: string) {
    await notificationService.create({
      userId: employeeId,
      title: "Timesheet Approved",
      message: `Your ${hours}h timesheet entry has been approved by ${approverName}.`,
      type: "timesheet",
      link: "/time",
    });
  },

  // Projects & Tasks
  async onTaskAssigned(taskId: string, assigneeId: string, taskTitle: string, projectName: string, assignerName: string) {
    await notificationService.create({
      userId: assigneeId,
      title: "New Task Assigned",
      message: `${assignerName} assigned you "${taskTitle}" in ${projectName}.`,
      type: "task",
      referenceId: taskId,
      link: "/projects",
    });
  },

  async onProjectCreated(projectId: string, memberIds: string[], projectName: string, creatorName: string) {
    await notificationService.createMany(memberIds, {
      title: "Added to Project",
      message: `You have been added to project "${projectName}" by ${creatorName}.`,
      type: "project",
      referenceId: projectId,
      link: `/projects/${projectId}`,
    });
  },

  // Support
  async onTicketCreated(ticketId: string, subject: string, creatorName: string) {
    const hrItUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { name: { in: ["hr", "superadmin", "manager"] } },
      },
      select: { id: true },
    });

    await notificationService.createMany(
      hrItUsers.map((u) => u.id),
      {
        title: "New Support Ticket",
        message: `[${creatorName}] created ticket: ${subject}`,
        type: "support",
        referenceId: ticketId,
        link: "/support",
      }
    );
  },

  async onTicketResolved(ticketId: string, creatorId: string, subject: string) {
    await notificationService.create({
      userId: creatorId,
      title: "Support Ticket Resolved",
      message: `Your support ticket "${subject}" has been marked as resolved.`,
      type: "support",
      referenceId: ticketId,
      link: "/support",
    });
  },
};
