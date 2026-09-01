import { Request, Response } from "express";
import { userService } from "./user.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./user.schema";
import { AppError } from "../../utils/AppError";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = userQuerySchema.parse(req.query);
  const result = await userService.list(query);

  ApiResponse.success(res, 200, "Users fetched", result.data, result.pagination);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(req.params.id);
  ApiResponse.success(res, 200, "User fetched", user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);
  const user = await userService.create(body, req.user?.id);
  ApiResponse.success(res, 201, "User created", user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const body = updateUserSchema.parse(req.body);
  const user = await userService.update(req.params.id, body);
  ApiResponse.success(res, 200, "User updated", user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.remove(req.params.id);
  ApiResponse.success(res, 200, "User deleted");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = changePasswordSchema.parse(req.body);
  await userService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  ApiResponse.success(res, 200, "Password changed successfully");
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const user = await userService.getById(req.user.id);
  ApiResponse.success(res, 200, "Profile fetched", user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateProfileSchema.parse(req.body);
  const user = await userService.updateProfile(req.user.id, body);
  ApiResponse.success(res, 200, "Profile updated", user);
});
