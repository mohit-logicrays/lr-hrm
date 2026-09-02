import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "./announcement.schema";

const announcementSelect = {
  id: true,
  title: true,
  content: true,
  category: true,
  priority: true,
  isPinned: true,
  status: true,
  publishDate: true,
  expiryDate: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.AnnouncementSelect;

export class AnnouncementService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.AnnouncementWhereInput = {
      ...(params.category ? { category: params.category as any } : {}),
      ...(params.status ? { status: params.status as any } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { content: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        select: announcementSelect,
        orderBy: [{ isPinned: "desc" }, { publishDate: "desc" }],
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
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: announcementSelect,
    });
    if (!announcement) throw new AppError(404, "Announcement not found");
    return announcement;
  }

  async create(authorId: string, data: CreateAnnouncementInput) {
    return prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category as any,
        priority: data.priority,
        isPinned: data.isPinned,
        status: data.status as any,
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        authorId,
      },
      select: announcementSelect,
    });
  }

  async update(id: string, data: UpdateAnnouncementInput) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Announcement not found");

    return prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category as any,
        priority: data.priority,
        isPinned: data.isPinned,
        status: data.status as any,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
        expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
      },
      select: announcementSelect,
    });
  }

  async remove(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Announcement not found");
    await prisma.announcement.delete({ where: { id } });
  }
}

export const announcementService = new AnnouncementService();
