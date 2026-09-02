import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
  UpdateMemberInput,
} from "./team.schema";

const teamSelect = {
  id: true,
  name: true,
  description: true,
  departmentId: true,
  department: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
  _count: { select: { members: true, projects: true } },
} satisfies Prisma.TeamSelect;

export class TeamService {
  async list(params: { page?: number; limit?: number; search?: string; departmentId?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        select: teamSelect,
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

  async getById(id: string) {
    const team = await prisma.team.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...teamSelect,
        members: {
          select: {
            id: true,
            isTeamLead: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                designation: true,
              },
            },
          },
        },
      },
    });
    if (!team) throw new AppError(404, "Team not found");
    return team;
  }

  async create(data: CreateTeamInput) {
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, deletedAt: null },
    });
    if (!department) throw new AppError(404, "Department not found");

    const existing = await prisma.team.findFirst({
      where: { name: data.name, departmentId: data.departmentId, deletedAt: null },
    });
    if (existing) throw new AppError(409, "Team with this name already exists in the department");

    return prisma.team.create({ data, select: teamSelect });
  }

  async update(id: string, data: UpdateTeamInput) {
    const existing = await prisma.team.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "Team not found");

    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!department) throw new AppError(404, "Department not found");
    }

    return prisma.team.update({ where: { id }, data, select: teamSelect });
  }

  async remove(id: string) {
    const existing = await prisma.team.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "Team not found");

    const projectCount = await prisma.project.count({
      where: { primaryTeamId: id, deletedAt: null },
    });
    if (projectCount > 0) {
      throw new AppError(409, "Cannot delete team with projects. Unassign projects first.");
    }

    await prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addMember(data: AddMemberInput) {
    const team = await prisma.team.findFirst({
      where: { id: data.teamId, deletedAt: null },
    });
    if (!team) throw new AppError(404, "Team not found");

    const user = await prisma.user.findFirst({ where: { id: data.userId, deletedAt: null } });
    if (!user) throw new AppError(404, "User not found");

    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: data.userId, teamId: data.teamId } },
    });
    if (existing) throw new AppError(409, "User is already a member of this team");

    if (data.isTeamLead) {
      await prisma.teamMember.updateMany({
        where: { teamId: data.teamId, isTeamLead: true },
        data: { isTeamLead: false },
      });
    }

    return prisma.teamMember.create({
      data: {
        userId: data.userId,
        teamId: data.teamId,
        isTeamLead: data.isTeamLead ?? false,
      },
    });
  }

  async updateMember(teamId: string, userId: string, data: UpdateMemberInput) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) throw new AppError(404, "Team member not found");

    if (data.isTeamLead) {
      await prisma.teamMember.updateMany({
        where: { teamId, isTeamLead: true },
        data: { isTeamLead: false },
      });
    }

    return prisma.teamMember.update({
      where: { id: member.id },
      data: { isTeamLead: data.isTeamLead ?? false },
    });
  }

  async removeMember(teamId: string, userId: string) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) throw new AppError(404, "Team member not found");

    await prisma.teamMember.delete({ where: { id: member.id } });
  }
}

export const teamService = new TeamService();
