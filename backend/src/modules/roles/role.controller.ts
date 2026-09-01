import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    orderBy: { priority: "asc" },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      isSpecial: true,
      priority: true,
      _count: { select: { users: true } },
    },
  });

  ApiResponse.success(res, 200, "Roles fetched", roles);
});

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany({
    orderBy: { group: "asc" },
    select: { id: true, key: true, group: true, description: true },
  });

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    (acc[p.group] ||= []).push(p);
    return acc;
  }, {});

  ApiResponse.success(res, 200, "Permissions fetched", grouped);
});
