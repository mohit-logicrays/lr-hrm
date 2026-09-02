import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateNotificationInput,
  UpdatePreferencesInput,
} from "./notification.schema";

export class NotificationService {
  /**
   * List notifications for a specific user
   */
  async list(userId: string, page = 1, pageSize = 20, unreadOnly = false) {
    const where: any = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [total, unreadCount, data] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      unreadCount,
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

  /**
   * Get total unread count for badges
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Create a single notification for a user
   */
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        referenceId: input.referenceId,
        link: input.link,
        metadata: input.metadata,
      },
    });
  }

  /**
   * Broadcast notification to multiple users (e.g. all HR, all Project Members)
   */
  async createMany(userIds: string[], data: Omit<CreateNotificationInput, "userId">) {
    if (userIds.length === 0) return { count: 0 };
    const records = userIds.map((userId) => ({
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      referenceId: data.referenceId,
      link: data.link,
      metadata: data.metadata,
    }));

    return prisma.notification.createMany({
      data: records,
    });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) throw new AppError(404, "Notification not found");

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete single notification
   */
  async delete(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) throw new AppError(404, "Notification not found");

    return prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Clear / delete all notifications for current user
   */
  async clearAll(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return pref;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, data: UpdatePreferencesInput) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }

  /**
   * Save Web Push subscription payload
   */
  async savePushSubscription(userId: string, subscription: any) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        pushSubscription: subscription,
      },
      update: {
        pushSubscription: subscription,
      },
    });
  }
}

export const notificationService = new NotificationService();
