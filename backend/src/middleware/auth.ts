import { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/prisma";
import { permissionService } from "../modules/permissions/permission.service";
import { ApiResponse } from "../utils/ApiResponse";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.[config.jwt.cookieName];

    if (!token) {
      const header = req.headers.authorization;
      if (header?.startsWith("Bearer ")) {
        token = header.slice("Bearer ".length);
      }
    }

    if (!token) {
      ApiResponse.error(res, 401, "Not authenticated");
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      ApiResponse.error(res, 401, "Invalid or expired session");
      return;
    }

    const permissions = await permissionService.getPermissionsForUser(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleName: user.role.name,
      isSpecialRole: user.isSpecialRole,
      specialRoleName: user.specialRoleName,
      permissions,
    };

    next();
  } catch (err) {
    ApiResponse.error(res, 401, "Invalid or expired session");
  }
}
