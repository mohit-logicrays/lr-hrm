import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
  UpdateMemberInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  CreateCommentInput,
} from "./project.schema";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  designation: true,
};

const projectSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  status: true,
  priority: true,
  startDate: true,
  endDate: true,
  actualEndDate: true,
  progress: true,
  departmentId: true,
  primaryTeamId: true,
  projectManagerId: true,
  createdById: true,
  budget: true,
  clientName: true,
  isBillable: true,
  category: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true, code: true } },
  primaryTeam: { select: { id: true, name: true } },
  projectManager: { select: userSelect },
  createdBy: { select: userSelect },
  members: {
    select: {
      id: true,
      roleInProject: true,
      joinedAt: true,
      user: { select: userSelect },
    },
  },
  _count: { select: { members: true, tasks: true, milestones: true, files: true, timeLogs: true } },
} satisfies Prisma.ProjectSelect;

export class ProjectService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    departmentId?: string;
    primaryTeamId?: string;
    projectManagerId?: string;
    userId?: string;
    userRole?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status as any } : {}),
      ...(params.priority ? { priority: params.priority as any } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.primaryTeamId ? { primaryTeamId: params.primaryTeamId } : {}),
      ...(params.projectManagerId ? { projectManagerId: params.projectManagerId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { code: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
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
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...projectSelect,
        members: {
          select: {
            id: true,
            roleInProject: true,
            joinedAt: true,
            user: { select: userSelect },
          },
        },
        tasks: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          select: {
            id: true,
            taskCode: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            startDate: true,
            estimatedHours: true,
            actualHours: true,
            order: true,
            labels: true,
            isCompleted: true,
            assignee: { select: userSelect },
            reporter: { select: userSelect },
            _count: { select: { subtasks: true, comments: true } },
            subtasks: {
              where: { deletedAt: null },
              select: {
                id: true,
                title: true,
                isCompleted: true,
                assignee: { select: userSelect },
              },
            },
          },
        },
        milestones: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            completedAt: true,
            status: true,
            progress: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            action: true,
            metadata: true,
            createdAt: true,
            user: { select: userSelect },
          },
        },
        files: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            size: true,
            uploadedAt: true,
            uploadedBy: { select: userSelect },
          },
        },
      },
    });

    if (!project) throw new AppError(404, "Project not found");
    return project;
  }

  async create(data: CreateProjectInput, createdById?: string) {
    if (data.code) {
      const existing = await prisma.project.findFirst({
        where: { code: data.code, deletedAt: null },
      });
      if (existing) throw new AppError(409, `Project code "${data.code}" already exists`);
    }

    const { initialMembers, initialMilestones, ...projectData } = data;

    const newProject = await prisma.project.create({
      data: {
        ...projectData,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdById,
        members: initialMembers?.length
          ? {
              createMany: {
                data: initialMembers.map((m) => ({
                  userId: m.userId,
                  roleInProject: m.roleInProject as any,
                })),
              },
            }
          : undefined,
        milestones: initialMilestones?.length
          ? {
              createMany: {
                data: initialMilestones.map((m) => ({
                  title: m.title,
                  description: m.description || null,
                  dueDate: m.dueDate ? new Date(m.dueDate) : null,
                })),
              },
            }
          : undefined,
        activities: {
          create: {
            userId: createdById,
            action: "Project Created",
            metadata: { name: data.name, code: data.code },
          },
        },
      },
      select: projectSelect,
    });

    return newProject;
  }

  async update(id: string, data: UpdateProjectInput, updatedById?: string) {
    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "Project not found");

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.project.findFirst({
        where: { code: data.code, deletedAt: null },
      });
      if (duplicate) throw new AppError(409, `Project code "${data.code}" already exists`);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
      },
      select: projectSelect,
    });

    // Log Activity
    await prisma.projectActivity.create({
      data: {
        projectId: id,
        userId: updatedById,
        action: "Project Updated",
        metadata: { changes: Object.keys(data) },
      },
    });

    return updated;
  }

  async remove(id: string, deletedById?: string) {
    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "Project not found");

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: id,
        userId: deletedById,
        action: "Project Deleted",
      },
    });
  }

  // ---------- Members ----------
  async addMember(projectId: string, data: AddProjectMemberInput, addedById?: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw new AppError(404, "Project not found");

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: data.userId } },
    });
    if (existing) throw new AppError(409, "User is already a member of this project");

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        roleInProject: data.roleInProject as any,
      },
      select: {
        id: true,
        roleInProject: true,
        joinedAt: true,
        user: { select: userSelect },
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId,
        userId: addedById,
        action: "Member Added",
        metadata: { addedUserId: data.userId, role: data.roleInProject },
      },
    });

    return member;
  }

  async removeMember(projectId: string, userId: string, removedById?: string) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new AppError(404, "Member not found");

    await prisma.projectMember.delete({ where: { id: member.id } });

    await prisma.projectActivity.create({
      data: {
        projectId,
        userId: removedById,
        action: "Member Removed",
        metadata: { removedUserId: userId },
      },
    });
  }

  // ---------- Tasks ----------
  async listTasks(projectId: string) {
    return prisma.task.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { order: "asc" },
      select: {
        id: true,
        taskCode: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        startDate: true,
        estimatedHours: true,
        actualHours: true,
        order: true,
        labels: true,
        isCompleted: true,
        assignee: { select: userSelect },
        reporter: { select: userSelect },
        subtasks: {
          where: { deletedAt: null },
          select: { id: true, title: true, isCompleted: true, assignee: { select: userSelect } },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async createTask(projectId: string, data: CreateTaskInput, reporterId?: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw new AppError(404, "Project not found");

    // Generate Task Code e.g. TASK-1287
    const taskCount = await prisma.task.count({ where: { projectId } });
    const codePrefix = project.code || "TASK";
    const taskCode = data.taskCode || `${codePrefix}-${1000 + taskCount + 1}`;

    const task = await prisma.task.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        taskCode,
        status: data.status as any,
        priority: data.priority as any,
        assigneeId: data.assigneeId || null,
        reporterId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours || null,
        parentTaskId: data.parentTaskId || null,
        labels: data.labels ? (data.labels as any) : undefined,
      },
      select: {
        id: true,
        taskCode: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: userSelect },
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId,
        taskId: task.id,
        userId: reporterId,
        action: "Task Created",
        metadata: { title: task.title, taskCode: task.taskCode },
      },
    });

    await this.recalculateProjectProgress(projectId);

    return task;
  }

  async updateTaskStatus(taskId: string, status: string, updatedById?: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new AppError(404, "Task not found");

    const isCompleted = status === "DONE";
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: status as any,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: task.projectId,
        taskId,
        userId: updatedById,
        action: `Task Status Changed to ${status}`,
        metadata: { title: task.title, oldStatus: task.status, newStatus: status },
      },
    });

    await this.recalculateProjectProgress(task.projectId);
    return updated;
  }

  async updateTask(taskId: string, data: UpdateTaskInput, updatedById?: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new AppError(404, "Task not found");

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        status: data.status ? (data.status as any) : undefined,
        priority: data.priority ? (data.priority as any) : undefined,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
      },
    });

    await this.recalculateProjectProgress(task.projectId);
    return updated;
  }

  async deleteTask(taskId: string, deletedById?: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new AppError(404, "Task not found");

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    await this.recalculateProjectProgress(task.projectId);
  }

  // ---------- Milestones ----------
  async createMilestone(projectId: string, data: CreateMilestoneInput) {
    return prisma.milestone.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status as any,
      },
    });
  }

  async updateMilestone(milestoneId: string, data: UpdateMilestoneInput) {
    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...data,
        status: data.status ? (data.status as any) : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
      },
    });
  }

  // ---------- Comments ----------
  async addComment(taskId: string, content: string, userId: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new AppError(404, "Task not found");

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content,
      },
      select: {
        id: true,
        content: true,
        reactions: true,
        createdAt: true,
        user: { select: userSelect },
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: task.projectId,
        taskId,
        userId,
        action: "Comment Added",
      },
    });

    return comment;
  }

  async getTaskComments(taskId: string) {
    return prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        reactions: true,
        createdAt: true,
        user: { select: userSelect },
      },
    });
  }

  // ---------- Helper: Auto Recalculate Project Progress ----------
  private async recalculateProjectProgress(projectId: string) {
    const [totalTasks, completedTasks] = await Promise.all([
      prisma.task.count({ where: { projectId, deletedAt: null } }),
      prisma.task.count({ where: { projectId, status: "DONE", deletedAt: null } }),
    ]);

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });
  }
}

export const projectService = new ProjectService();
