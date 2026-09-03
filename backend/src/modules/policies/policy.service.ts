import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { NotificationService } from "../notifications/notification.service";
import type {
  CreatePolicyInput,
  UpdatePolicyInput,
} from "./policy.schema";

const notificationService = new NotificationService();

const policySelect = {
  id: true,
  title: true,
  code: true,
  category: true,
  version: true,
  content: true,
  fileUrl: true,
  isMandatory: true,
  effectiveDate: true,
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
  _count: { select: { acknowledgments: true } },
} satisfies Prisma.CompanyPolicySelect;

export class PolicyService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    userId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.CompanyPolicyWhereInput = {
      ...(params.category ? { category: params.category as any } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { code: { contains: params.search, mode: "insensitive" } },
              { content: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rawData] = await Promise.all([
      prisma.companyPolicy.count({ where }),
      prisma.companyPolicy.findMany({
        where,
        select: policySelect,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    let data = rawData as Array<typeof rawData[0] & { isAcknowledged?: boolean }>;
    if (params.userId && rawData.length > 0) {
      const userAcks = await prisma.policyAcknowledgment.findMany({
        where: {
          userId: params.userId,
          policyId: { in: rawData.map((p) => p.id) },
        },
        select: { policyId: true },
      });
      const ackSet = new Set(userAcks.map((a) => a.policyId));
      data = rawData.map((p) => ({
        ...p,
        isAcknowledged: ackSet.has(p.id),
      }));
    }

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

  async getById(id: string, userId?: string) {
    const policy = await prisma.companyPolicy.findUnique({
      where: { id },
      select: policySelect,
    });
    if (!policy) throw new AppError(404, "Policy not found");

    let isAcknowledged = false;
    if (userId) {
      const ack = await prisma.policyAcknowledgment.findUnique({
        where: { policyId_userId: { policyId: id, userId } },
      });
      isAcknowledged = Boolean(ack);
    }

    return { ...policy, isAcknowledged };
  }

  async getAcknowledgmentStats(policyId: string) {
    const policy = await prisma.companyPolicy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError(404, "Policy not found");

    const [totalActiveUsers, acks] = await Promise.all([
      prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.policyAcknowledgment.findMany({
        where: { policyId },
        orderBy: { acknowledgedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              department: { select: { id: true, name: true } },
              role: { select: { name: true, displayName: true } },
            },
          },
        },
      }),
    ]);

    return {
      totalActiveUsers,
      totalAcknowledged: acks.length,
      acknowledgments: acks,
    };
  }

  async create(authorId: string, data: CreatePolicyInput) {
    const policy = await prisma.companyPolicy.create({
      data: {
        title: data.title,
        code: data.code ?? null,
        category: data.category as any,
        version: data.version,
        content: data.content,
        fileUrl: data.fileUrl ?? null,
        isMandatory: data.isMandatory,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
        authorId,
      },
      select: policySelect,
    });

    // Broadcast to all active users
    try {
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        await notificationService.createMany(userIds, {
          title: `New Policy Published: ${policy.title}`,
          message: policy.isMandatory
            ? `Action required: Please review and acknowledge the newly published policy.`
            : `A new company policy "${policy.title}" has been published.`,
          type: "policy",
          referenceId: policy.id,
          link: "/policies",
        });
      }
    } catch (err) {
      console.error("Failed to broadcast policy notification:", err);
    }

    return policy;
  }

  async update(id: string, data: UpdatePolicyInput) {
    const existing = await prisma.companyPolicy.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Policy not found");

    const updated = await prisma.companyPolicy.update({
      where: { id },
      data: {
        title: data.title,
        code: data.code,
        category: data.category as any,
        version: data.version,
        content: data.content,
        fileUrl: data.fileUrl,
        isMandatory: data.isMandatory,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      },
      select: policySelect,
    });

    // Broadcast update to all active users
    try {
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        await notificationService.createMany(userIds, {
          title: `Policy Updated: ${updated.title}`,
          message: `The company policy "${updated.title}" has been updated (${updated.version}).`,
          type: "policy",
          referenceId: updated.id,
          link: "/policies",
        });
      }
    } catch (err) {
      console.error("Failed to broadcast policy update notification:", err);
    }

    return updated;
  }

  async acknowledge(policyId: string, userId: string) {
    const policy = await prisma.companyPolicy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError(404, "Policy not found");

    return prisma.policyAcknowledgment.upsert({
      where: { policyId_userId: { policyId, userId } },
      create: { policyId, userId },
      update: { acknowledgedAt: new Date() },
    });
  }

  async remove(id: string) {
    const existing = await prisma.companyPolicy.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Policy not found");
    await prisma.companyPolicy.delete({ where: { id } });
  }
}

export const policyService = new PolicyService();
