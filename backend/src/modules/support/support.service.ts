import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  CreateTicketCommentInput,
} from "./support.schema";

const ticketSelect = {
  id: true,
  ticketNumber: true,
  subject: true,
  category: true,
  priority: true,
  status: true,
  description: true,
  attachments: true,
  creatorId: true,
  assigneeId: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      department: { select: { id: true, name: true } },
    },
  },
  assignee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
    },
  },
  comments: {
    select: {
      id: true,
      content: true,
      isInternalNote: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { comments: true } },
} satisfies Prisma.SupportTicketSelect;

export class SupportService {
  async list(
    user: { id: string; roleName: string },
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      priority?: string;
      status?: string;
      creatorId?: string;
      assigneeId?: string;
      scope?: string;
    }
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const roleUpper = (user.roleName || "").toUpperCase();
    const isAdminOrAgent = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "IT_ADMIN", "MANAGER", "HR"].includes(roleUpper);

    // If scope is "my" or user is a regular member, lock creatorId to user.id
    const creatorFilter = params.scope === "my" || !isAdminOrAgent ? user.id : params.creatorId;

    const where: Prisma.SupportTicketWhereInput = {
      ...(creatorFilter ? { creatorId: creatorFilter } : {}),
      ...(params.assigneeId ? { assigneeId: params.assigneeId } : {}),
      ...(params.category ? { category: params.category as any } : {}),
      ...(params.priority ? { priority: params.priority as any } : {}),
      ...(params.status ? { status: params.status as any } : {}),
      ...(params.search
        ? {
            OR: [
              { subject: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        select: ticketSelect,
        orderBy: { updatedAt: "desc" },
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

  async getById(id: string, user: { id: string; roleName: string }) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: ticketSelect,
    });
    if (!ticket) throw new AppError(404, "Support ticket not found");

    const roleUpper = (user.roleName || "").toUpperCase();
    const isAdminOrAgent = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "IT_ADMIN", "MANAGER", "HR"].includes(roleUpper);

    if (!isAdminOrAgent && ticket.creatorId !== user.id) {
      throw new AppError(403, "You do not have permission to view this ticket");
    }

    // Filter out internal notes for regular non-admin users
    if (!isAdminOrAgent) {
      ticket.comments = ticket.comments.filter((c) => !c.isInternalNote);
    }

    return ticket;
  }

  async create(creatorId: string, data: CreateTicketInput) {
    return prisma.supportTicket.create({
      data: {
        subject: data.subject,
        category: data.category as any,
        priority: data.priority as any,
        description: data.description,
        attachments: data.attachments ?? null,
        creatorId,
        status: "OPEN",
      },
      select: ticketSelect,
    });
  }

  async update(id: string, user: { id: string; roleName: string }, data: UpdateTicketInput) {
    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Support ticket not found");

    const roleUpper = (user.roleName || "").toUpperCase();
    const isAdminOrAgent = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "IT_ADMIN", "MANAGER", "HR"].includes(roleUpper);

    if (!isAdminOrAgent && existing.creatorId !== user.id) {
      throw new AppError(403, "You cannot update this support ticket");
    }

    const resolvedAt = data.status === "RESOLVED" || data.status === "CLOSED" ? new Date() : existing.resolvedAt;

    return prisma.supportTicket.update({
      where: { id },
      data: {
        subject: data.subject,
        category: data.category as any,
        priority: data.priority as any,
        status: data.status as any,
        assigneeId: data.assigneeId,
        description: data.description,
        resolvedAt,
      },
      select: ticketSelect,
    });
  }

  async addComment(ticketId: string, authorId: string, data: CreateTicketCommentInput) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError(404, "Support ticket not found");

    return prisma.ticketComment.create({
      data: {
        ticketId,
        authorId,
        content: data.content,
        isInternalNote: data.isInternalNote,
      },
      select: {
        id: true,
        content: true,
        isInternalNote: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Support ticket not found");
    await prisma.supportTicket.delete({ where: { id } });
  }
}

export const supportService = new SupportService();
