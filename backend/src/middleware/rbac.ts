import { NextFunction, Request, Response } from "express";
import type { PermissionKey } from "../modules/permissions/permissions.constants";
import { ApiResponse } from "../utils/ApiResponse";

export function requirePermission(...permissions: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error(res, 401, "Not authenticated");
      return;
    }

    const allowed = permissions.some((p) => req.user!.permissions.includes(p));
    if (!allowed) {
      ApiResponse.error(res, 403, "You do not have permission to perform this action");
      return;
    }

    next();
  };
}

export function requireRoles(...roles: string[]) {
  const normalizedRoles = roles.map((r) => r.toLowerCase());
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error(res, 401, "Not authenticated");
      return;
    }

    const userRole = (req.user.roleName || "").toLowerCase();
    const hasRole = normalizedRoles.includes(userRole) || (req.user.isSpecialRole && normalizedRoles.includes("superadmin"));

    if (!hasRole) {
      ApiResponse.error(res, 403, "You do not have the required role to perform this action");
      return;
    }

    next();
  };
}
