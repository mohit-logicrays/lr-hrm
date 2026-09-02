import { Request, Response } from "express";
import { announcementService } from "./announcement.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementQuerySchema,
} from "./announcement.schema";
import { AppError } from "../../utils/AppError";

export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const query = announcementQuerySchema.parse(req.query);
  const result = await announcementService.list(query);
  ApiResponse.success(res, 200, "Announcements fetched", result.data, result.pagination);
});

export const getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.getById(req.params.id);
  ApiResponse.success(res, 200, "Announcement fetched", announcement);
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createAnnouncementSchema.parse(req.body);
  const announcement = await announcementService.create(req.user.id, body);
  ApiResponse.success(res, 201, "Announcement created successfully", announcement);
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const body = updateAnnouncementSchema.parse(req.body);
  const announcement = await announcementService.update(req.params.id, body);
  ApiResponse.success(res, 200, "Announcement updated", announcement);
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  await announcementService.remove(req.params.id);
  ApiResponse.success(res, 200, "Announcement deleted");
});
