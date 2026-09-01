import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";
import {
  createRoleSchema,
  updateRoleSchema,
  setRolePermissionsSchema,
} from "./role.schema";

const roleSelect = {
  id: true,
  name: true,
  displayName: true,
  description: true,
  isSpecial: true,
  isSystem: true,
  priority: true,
  _count: { select: { users: true } },
} satisfies Prisma.RoleSelect;

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    orderBy: [{ isSpecial: "asc" }, { priority: "asc" }],
    select: {
      ...roleSelect,
      rolePermissions: {
        select: { permission: { select: { key: true } } },
      },
    },
  });

  const data = roles.map(
    ({ rolePermissions, ...role }) => ({
      ...role,
      permissionKeys: rolePermissions.map((rp) => rp.permission.key),
    })
  );

  ApiResponse.success(res, 200, "Roles fetched", data);
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    select: {
      ...roleSelect,
      rolePermissions: {
        select: { permission: { select: { key: true } } },
      },
    },
  });

  if (!role) throw new AppError(404, "Role not found");

  const { rolePermissions, ...rest } = role;
  ApiResponse.success(res, 200, "Role fetched", {
    ...rest,
    permissionKeys: rolePermissions.map((rp) => rp.permission.key),
  });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const body = createRoleSchema.parse(req.body);

  const existing = await prisma.role.findUnique({
    where: { name: body.name },
  });
  if (existing) {
    throw new AppError(409, `Role "${body.name}" already exists`);
  }

  const role = await prisma.role.create({
    data: {
      name: body.name,
      displayName: body.displayName,
      description: body.description ?? null,
      priority: body.priority,
      isSpecial: false,
      isSystem: false,
    },
    select: roleSelect,
  });

  ApiResponse.success(res, 201, "Role created", role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const body = updateRoleSchema.parse(req.body);

  const existing = await prisma.role.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw new AppError(404, "Role not found");
  if (existing.isSystem) {
    throw new AppError(400, "System roles cannot be modified");
  }

  const role = await prisma.role.update({
    where: { id: existing.id },
    data: body,
    select: roleSelect,
  });

  ApiResponse.success(res, 200, "Role updated", role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      isSystem: true,
      _count: { select: { users: true } },
    },
  });
  if (!role) throw new AppError(404, "Role not found");
  if (role.isSystem) {
    throw new AppError(400, "System roles cannot be deleted");
  }
  if (role._count.users > 0) {
    throw new AppError(409, "Cannot delete a role that has users assigned");
  }

  await prisma.role.delete({ where: { id: role.id } });

  ApiResponse.success(res, 200, "Role deleted");
});

export const setRolePermissions = asyncHandler(
  async (req: Request, res: Response) => {
    const body = setRolePermissionsSchema.parse(req.body);

    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
    });
    if (!role) throw new AppError(404, "Role not found");
    if (role.isSpecial) {
      throw new AppError(
        400,
        "Special roles inherit all permissions and cannot be modified"
      );
    }
    if (role.isSystem) {
      throw new AppError(400, "System roles cannot be modified");
    }

    const permissionKeys = [...new Set(body.permissionKeys)];
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });
    if (permissions.length !== permissionKeys.length) {
      throw new AppError(400, "One or more permission keys are invalid");
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      }),
    ]);

    const updated = await prisma.role.findUnique({
      where: { id: role.id },
      select: {
        id: true,
        rolePermissions: {
          select: { permission: { select: { key: true } } },
        },
      },
    });

    ApiResponse.success(res, 200, "Role permissions updated", {
      id: updated!.id,
      permissionKeys: updated!.rolePermissions.map((rp) => rp.permission.key),
    });
  }
);

export const listPermissions = asyncHandler(
  async (_req: Request, res: Response) => {
    const permissions = await prisma.permission.findMany({
      orderBy: { group: "asc" },
      select: { id: true, key: true, group: true, description: true },
    });

    const grouped = permissions.reduce<Record<string, typeof permissions>>(
      (acc, p) => {
        (acc[p.group] ||= []).push(p);
        return acc;
      },
      {}
    );

    ApiResponse.success(res, 200, "Permissions fetched", grouped);
  }
);