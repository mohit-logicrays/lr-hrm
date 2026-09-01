import { Request, Response } from "express";
import { authService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { loginSchema } from "./auth.schema";
import { setAuthCookies, clearAuthCookies } from "../../utils/jwt";
import { config } from "../../config";
import { AppError } from "../../utils/AppError";

function getClientIp(req: Request): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip;
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);

  const result = await authService.login(body.email, body.password, getClientIp(req));

  setAuthCookies(res, result.accessToken, result.refreshToken);

  ApiResponse.success(res, 200, "Login successful", result.user);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken =
    req.cookies?.[config.jwt.refreshCookieName] || req.body?.token || null;

  const result = await authService.refresh(refreshToken);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  ApiResponse.success(res, 200, "Token refreshed", result.user);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");

  const result = await authService.me(req.user.id);

  ApiResponse.success(res, 200, "User fetched", {
    user: result.user,
    permissions: result.permissions,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[config.jwt.refreshCookieName] || null;

  if (req.user) {
    await authService.logout(req.user.id, refreshToken);
  }

  clearAuthCookies(res);

  ApiResponse.success(res, 200, "Logged out successfully");
});
