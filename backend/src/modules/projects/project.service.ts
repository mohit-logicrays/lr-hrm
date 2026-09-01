import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
  UpdateMemberInput,
} from "./project.schema";

const projectSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  status: true,
  teamId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  team: { select: { id: true, name: true } },
  _count: { select: { members: true, timeLogs: true } },
} satisfies Prisma.ProjectSelect;

export class ProjectService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    teamId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.ProjectWhereInput = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.teamId ? { teamId: params.teamId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { code: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        select: projectSelect,
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
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        ...projectSelect,
        members: {
          select: {
            id: true,
            projectRole: true,
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
    if (!project) throw new AppError(404, "Project not found");
    return project;
  }

  async create(data: CreateProjectInput, createdBy?: string) {
    if (data.code) {
      const existing = await prisma.project.findUnique({ where: { code: data.code } });
      if (existing) throw new AppError(409, "Project with this code already exists");
    }

    if (data.teamId) {
      const team = await prisma.team.findUnique({ where: { id: data.teamId } });
      if (!team) throw new AppError(404, "Team not found");
    }

    return prisma.project.create({
      data: { ...data, createdBy: createdBy ?? null },
      select: projectSelect,
    });
  }

  async update(id: string, data: UpdateProjectInput) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Project not found");

    if (data.teamId) {
      const team = await prisma.team.findUnique({ where: { id: data.teamId } });
      if (!team) throw new AppError(404, "Team not found");
    }

    return prisma.project.update({ where: { id }, data, select: projectSelect });
  }

  async remove(id: string) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Project not found");
    await prisma.project.delete({ where: { id } });
  }

  async addMember(data: AddProjectMemberInput) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new AppError(404, "Project not found");

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new AppError(404, "User not found");

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: data.projectId, userId: data.userId } },
    });
    if (existing) throw new AppError(409, "User is already a member of this project");

    return prisma.projectMember.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        projectRole: data.projectRole ?? null,
      },
    });
  }

  async updateMember(projectId: string, userId: string, data: UpdateMemberInput) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new AppError(404, "Project member not found");

    return prisma.projectMember.update({
      where: { id: member.id },
      data: { projectRole: data.projectRole },
    });
  }

  async removeMember(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new AppError(404, "Project member not found");
    await prisma.projectMember.delete({ where: { id: member.id } });
  }
}

export const projectService = new ProjectService();
