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
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error(res, 401, "Not authenticated");
      return;
    }

    if (!roles.includes(req.user.roleName)) {
      ApiResponse.error(res, 403, "You do not have the required role to perform this action");
      return;
    }

    next();
  };
}
