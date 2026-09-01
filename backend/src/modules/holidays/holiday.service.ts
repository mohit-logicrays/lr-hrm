import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type { CreateHolidayInput, UpdateHolidayInput } from "./holiday.schema";

const holidaySelect = {
  id: true,
  name: true,
  date: true,
  year: true,
  isOptional: true,
  createdAt: true,
} satisfies Prisma.HolidaySelect;

export class HolidayService {
  async list(params: { page?: number; limit?: number; year?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.HolidayWhereInput = {
      ...(params.year ? { year: params.year } : {}),
      ...(params.search
        ? { name: { contains: params.search, mode: "insensitive" } }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.holiday.count({ where }),
      prisma.holiday.findMany({
        where,
        select: holidaySelect,
        orderBy: { date: "asc" },
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

  async create(data: CreateHolidayInput) {
    const date = new Date(data.date);
    const year = date.getFullYear();

    const existing = await prisma.holiday.findUnique({
      where: { date_year: { date, year } },
    });
    if (existing) throw new AppError(409, "A holiday already exists on this date");

    return prisma.holiday.create({
      data: { name: data.name, date, year, isOptional: data.isOptional },
      select: holidaySelect,
    });
  }

  async update(id: string, data: UpdateHolidayInput) {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Holiday not found");

    const date = data.date ? new Date(data.date) : existing.date;
    const year = date.getFullYear();

    return prisma.holiday.update({
      where: { id },
      data: {
        name: data.name,
        date,
        year,
        isOptional: data.isOptional,
      },
      select: holidaySelect,
    });
  }

  async remove(id: string) {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Holiday not found");
    await prisma.holiday.delete({ where: { id } });
  }
}

export const holidayService = new HolidayService();
