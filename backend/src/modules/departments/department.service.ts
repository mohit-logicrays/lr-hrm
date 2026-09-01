import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "./department.schema";

const departmentSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { teams: true, users: true } },
} satisfies Prisma.DepartmentSelect;

export class DepartmentService {
  async list(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.DepartmentWhereInput = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { code: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        select: departmentSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
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
    const department = await prisma.department.findUnique({
      where: { id },
      select: {
        ...departmentSelect,
        teams: { select: { id: true, name: true } },
      },
    });
    if (!department) throw new AppError(404, "Department not found");
    return department;
  }

  async create(data: CreateDepartmentInput) {
    const existing = await prisma.department.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError(409, "Department with this code already exists");

    return prisma.department.create({ data, select: departmentSelect });
  }

  async update(id: string, data: UpdateDepartmentInput) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Department not found");

    return prisma.department.update({
      where: { id },
      data,
      select: departmentSelect,
    });
  }

  async remove(id: string) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Department not found");

    const teamCount = await prisma.team.count({ where: { departmentId: id } });
    if (teamCount > 0) {
      throw new AppError(409, "Cannot delete department with teams. Remove teams first.");
    }

    await prisma.department.delete({ where: { id } });
  }
}

export const departmentService = new DepartmentService();
