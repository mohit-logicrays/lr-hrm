import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { notificationService } from "./notification.service";
import {
  updatePreferencesSchema,
  pushSubscribeSchema,
} from "./notification.schema";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
  const unreadOnly = req.query.unread === "true";

  const result = await notificationService.list(req.user!.id, page, pageSize, unreadOnly);
  res.status(200).json({
    success: true,
    message: "Notifications fetched",
    data: result.data,
    unreadCount: result.unreadCount,
    pagination: {
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      totalPages: result.pagination.totalPages,
      hasPrevious: result.pagination.hasPrevPage,
      hasNext: result.pagination.hasNextPage,
      previous: result.pagination.hasPrevPage ? page - 1 : null,
      next: result.pagination.hasNextPage ? page + 1 : null,
    },
  });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getUnreadCount(req.user!.id);
  ApiResponse.success(res, 200, "Unread count fetched", result);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const updated = await notificationService.markAsRead(req.params.id, req.user!.id);
  ApiResponse.success(res, 200, "Notification marked as read", updated);
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);
  ApiResponse.success(res, 200, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.delete(req.params.id, req.user!.id);
  ApiResponse.success(res, 200, "Notification deleted");
});

export const clearAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.clearAll(req.user!.id);
  ApiResponse.success(res, 200, "All notifications cleared");
});

export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const prefs = await notificationService.getPreferences(req.user!.id);
  ApiResponse.success(res, 200, "Preferences fetched", prefs);
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const body = updatePreferencesSchema.parse(req.body);
  const updated = await notificationService.updatePreferences(req.user!.id, body);
  ApiResponse.success(res, 200, "Preferences updated", updated);
});

export const pushSubscribe = asyncHandler(async (req: Request, res: Response) => {
  const body = pushSubscribeSchema.parse(req.body);
  await notificationService.savePushSubscription(req.user!.id, body.subscription);
  ApiResponse.success(res, 200, "Push notification subscription saved");
});
