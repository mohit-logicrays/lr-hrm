import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

export class ApprovalEngine {
  async canApproveUser(approverId: string, targetUserId: string, approverRoleName: string, isSpecialRole = false): Promise<boolean> {
    if (approverId === targetUserId) return false;
    if (isSpecialRole || ["superadmin", "hr"].includes(approverRoleName.toLowerCase())) return true;

    const targetEmployment = await prisma.userCurrentEmployment.findUnique({
      where: { userId: targetUserId },
      select: { reportingManagerId: true, projectManagerId: true },
    });
    if (targetEmployment?.reportingManagerId === approverId || targetEmployment?.projectManagerId === approverId) return true;

    const ledTeamMembers = await prisma.teamMember.findMany({
      where: { userId: approverId, isTeamLead: true, team: { deletedAt: null } },
      select: {
        team: {
          select: {
            members: {
              where: { userId: targetUserId },
              select: { userId: true },
            },
          },
        },
      },
    });
    if (ledTeamMembers.some((tm) => (tm.team?.members?.length ?? 0) > 0)) return true;

    const managedProjects = await prisma.project.findMany({
      where: { projectManagerId: approverId, deletedAt: null },
      select: { members: { where: { userId: targetUserId }, select: { userId: true } } },
    });
    if (managedProjects.some((p) => p.members.length > 0)) return true;

    return false;
  }

  async getApproverIdsForUser(targetUserId: string): Promise<{
    hrIds: string[];
    tlIds: string[];
    pmIds: string[];
    reportingManagerIds: string[];
    allApproverIds: string[];
  }> {
    const [hrUsers, emp, ledTeams, userProjects] = await Promise.all([
      // 1. All HR Admins and Superadmins
      prisma.user.findMany({
        where: { deletedAt: null, role: { name: { in: ["hr", "superadmin"] } } },
        select: { id: true },
      }),
      // 2. Direct Employment hierarchy (Reporting Manager + Project Manager)
      prisma.userCurrentEmployment.findUnique({
        where: { userId: targetUserId },
        select: { reportingManagerId: true, projectManagerId: true },
      }),
      // 3. Team Leads of any team the target user belongs to
      prisma.teamMember.findMany({
        where: {
          isTeamLead: true,
          team: {
            deletedAt: null,
            members: { some: { userId: targetUserId } },
          },
        },
        select: { userId: true },
      }),
      // 4. Project Managers of projects the user is on + Members with role LEAD
      prisma.project.findMany({
        where: {
          deletedAt: null,
          members: { some: { userId: targetUserId } },
        },
        select: {
          projectManagerId: true,
          members: {
            where: { roleInProject: "LEAD" },
            select: { userId: true },
          },
        },
      }),
    ]);

    const hrIds = hrUsers.map((u) => u.id);
    const tlSet = new Set<string>();
    ledTeams.forEach((lt) => tlSet.add(lt.userId));
    userProjects.forEach((p) => {
      p.members.forEach((m) => tlSet.add(m.userId));
    });

    const pmSet = new Set<string>();
    if (emp?.projectManagerId) pmSet.add(emp.projectManagerId);
    userProjects.forEach((p) => {
      if (p.projectManagerId) pmSet.add(p.projectManagerId);
    });

    const repSet = new Set<string>();
    if (emp?.reportingManagerId) repSet.add(emp.reportingManagerId);

    const allSet = new Set<string>([...hrIds, ...Array.from(tlSet), ...Array.from(pmSet), ...Array.from(repSet)]);
    allSet.delete(targetUserId);

    return {
      hrIds,
      tlIds: Array.from(tlSet).filter((id) => id !== targetUserId),
      pmIds: Array.from(pmSet).filter((id) => id !== targetUserId),
      reportingManagerIds: Array.from(repSet).filter((id) => id !== targetUserId),
      allApproverIds: Array.from(allSet),
    };
  }

  async getSupervisedUserIds(approverId: string, approverRoleName: string, isSpecialRole = false): Promise<string[] | null> {
    if (isSpecialRole || ["superadmin", "hr"].includes(approverRoleName.toLowerCase())) return null;

    const [managedEmployments, ledTeamMembers, managedProjects] = await Promise.all([
      prisma.userCurrentEmployment.findMany({
        where: { OR: [{ reportingManagerId: approverId }, { projectManagerId: approverId }] },
        select: { userId: true },
      }),
      prisma.teamMember.findMany({
        where: { userId: approverId, isTeamLead: true, team: { deletedAt: null } },
        select: { team: { select: { members: { select: { userId: true } } } } },
      }),
      prisma.project.findMany({
        where: { projectManagerId: approverId, deletedAt: null },
        select: { members: { select: { userId: true } } },
      }),
    ]);

    const userIds = new Set<string>();
    managedEmployments.forEach((e) => userIds.add(e.userId));
    ledTeamMembers.forEach((tm) => tm.team?.members.forEach((m) => userIds.add(m.userId)));
    managedProjects.forEach((p) => p.members.forEach((m) => userIds.add(m.userId)));
    userIds.delete(approverId);
    return Array.from(userIds);
  }

  async recordLog(module: "WFH" | "LEAVE" | "TIMESHEET", referenceId: string, action: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED", performedById: string, comment?: string | null) {
    return prisma.approvalLog.create({
      data: { module, referenceId, action, performedById, comment: comment || null },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, designation: true, role: { select: { name: true, displayName: true } } },
        },
      },
    });
  }

  async getLogs(module: "WFH" | "LEAVE" | "TIMESHEET", referenceId: string) {
    return prisma.approvalLog.findMany({
      where: { module, referenceId },
      orderBy: { createdAt: "asc" },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, designation: true, role: { select: { name: true, displayName: true } } },
        },
      },
    });
  }
}

export const approvalEngine = new ApprovalEngine();
