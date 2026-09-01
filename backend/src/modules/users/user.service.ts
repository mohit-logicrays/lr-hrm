import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { config } from "../../config";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  designation: true,
  status: true,
  isSpecialRole: true,
  specialRoleName: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, displayName: true } },
  department: { select: { id: true, name: true, code: true } },
} satisfies Prisma.UserSelect;

export class UserService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    departmentId?: string;
    status?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.roleId ? { roleId: params.roleId } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: "insensitive" } },
              { lastName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
              { designation: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }

  async create(data: CreateUserInput, createdBy?: string) {
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (existing) throw new AppError(409, "User with this email already exists");

    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) throw new AppError(404, "Role not found");

    const password = data.password || config.defaultPassword;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        designation: data.designation ?? null,
        roleId: role.id,
        departmentId: data.departmentId ?? null,
        status: data.status,
        password: passwordHash,
        isSpecialRole: role.isSpecial,
        specialRoleName: role.isSpecial ? role.displayName : null,
        mustChangePassword: Boolean(data.password),
        createdBy,
      },
      select: userSelect,
    });

    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "User not found");

    const roleId = data.roleId ?? existing.roleId;
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new AppError(404, "Role not found");

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        designation: data.designation,
        roleId,
        departmentId: data.departmentId,
        status: data.status,
        isSpecialRole: role.isSpecial || existing.isSpecialRole,
        specialRoleName: role.isSpecial ? role.displayName : existing.specialRoleName,
      },
      select: userSelect,
    });

    return user;
  }

  async remove(id: string) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "User not found");

    // Soft delete: mark deletedAt (status also set to INACTIVE)
    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE", deletedAt: new Date() },
    });
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new AppError(404, "User not found");

    const valid = await comparePassword(oldPassword, user.password);
    if (!valid) throw new AppError(400, "Current password is incorrect");

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: newHash, mustChangePassword: false },
    });
  }

  async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string | null; designation?: string | null }
  ) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new AppError(404, "User not found");

    return prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        designation: data.designation,
      },
      select: userSelect,
    });
  }
}

export const userService = new UserService();
