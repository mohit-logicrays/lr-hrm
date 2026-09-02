import { Request, Response } from "express";
import { profileService } from "./profile.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";
import {
  updateBasicDetailsSchema,
  updateAddressSchema,
  updateEmergencyContactSchema,
  updateProfilePictureSchema,
  changeProfilePasswordSchema,
} from "./profile.schema";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const profile = await profileService.getProfile(req.user.id);
  ApiResponse.success(res, 200, "Profile fetched", profile);
});

export const updateBasic = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateBasicDetailsSchema.parse(req.body);
  const updated = await profileService.updateBasic(req.user.id, body);
  ApiResponse.success(res, 200, "Basic details updated successfully", updated);
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateAddressSchema.parse(req.body);
  const updated = await profileService.updateAddress(req.user.id, body);
  ApiResponse.success(res, 200, "Address updated successfully", updated);
});

export const updateEmergency = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateEmergencyContactSchema.parse(req.body);
  const updated = await profileService.updateEmergency(req.user.id, body);
  ApiResponse.success(res, 200, "Emergency contact updated successfully", updated);
});

export const updatePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateProfilePictureSchema.parse(req.body);
  const updated = await profileService.updatePicture(req.user.id, body.avatarUrl);
  ApiResponse.success(res, 200, "Profile picture updated successfully", updated);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = changeProfilePasswordSchema.parse(req.body);
  const result = await profileService.changePassword(
    req.user.id,
    body.currentPassword,
    body.newPassword
  );
  ApiResponse.success(res, 200, "Password changed successfully", result);
});
