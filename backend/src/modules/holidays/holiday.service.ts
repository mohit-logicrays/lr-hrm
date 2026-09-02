import { Prisma, HolidayType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type { CreateHolidayInput, UpdateHolidayInput, ImportHolidayRowInput } from "./holiday.schema";

const holidaySelect = {
  id: true,
  name: true,
  date: true,
  year: true,
  type: true,
  isOptional: true,
  description: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HolidaySelect;

export class HolidayService {
  async list(params: { page?: number; limit?: number; year?: number; search?: string; type?: HolidayType }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const where: Prisma.HolidayWhereInput = {
      deletedAt: null,
      ...(params.year ? { year: params.year } : {}),
      ...(params.type ? { type: params.type } : {}),
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

  async create(data: CreateHolidayInput, createdById?: string) {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) throw new AppError(400, "Invalid date format");
    const year = date.getFullYear();

    const existing = await prisma.holiday.findFirst({
      where: {
        date,
        year,
        deletedAt: null,
      },
    });
    if (existing) throw new AppError(409, `A holiday ("${existing.name}") already exists on ${date.toISOString().split("T")[0]}`);

    return prisma.holiday.create({
      data: {
        name: data.name,
        date,
        year,
        type: data.type || "NATIONAL",
        isOptional: Boolean(data.isOptional),
        description: data.description ?? null,
        createdById: createdById ?? null,
      },
      select: holidaySelect,
    });
  }

  async update(id: string, data: UpdateHolidayInput) {
    const existing = await prisma.holiday.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError(404, "Holiday not found");

    const date = data.date ? new Date(data.date) : existing.date;
    const year = date.getFullYear();

    return prisma.holiday.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        date,
        year,
        ...(data.type ? { type: data.type } : {}),
        ...(data.isOptional !== undefined ? { isOptional: data.isOptional } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      select: holidaySelect,
    });
  }

  async remove(id: string) {
    const existing = await prisma.holiday.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError(404, "Holiday not found");

    // Soft delete
    await prisma.holiday.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getUpcoming(daysAhead = 60) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.holiday.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: today,
          lte: futureDate,
        },
      },
      select: holidaySelect,
      orderBy: { date: "asc" },
      take: 10,
    });
  }

  getTemplateCsv() {
    return [
      "Holiday Name,Date,Type,Is Optional,Description",
      "Republic Day,2026-01-26,National,No,National Republic Day Observance",
      "Holi,2026-03-25,Restricted,Yes,Festival of Colors (Optional Restricted)",
      "Founders Day,2026-08-15,Company,No,Logic Rays Company Celebration",
    ].join("\n");
  }

  async importBulk(rows: ImportHolidayRowInput[], createdById?: string) {
    const validRows: Array<{ name: string; date: Date; year: number; type: HolidayType; isOptional: boolean; description?: string | null }> = [];
    const invalidRows: Array<{ row: number; data: any; reason: string }> = [];

    const existingHolidays = await prisma.holiday.findMany({
      where: { deletedAt: null },
      select: { date: true, year: true, name: true },
    });

    const existingDatesMap = new Set(
      existingHolidays.map((h) => `${h.date.toISOString().split("T")[0]}_${h.year}`)
    );

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      if (!r.name || !r.name.trim()) {
        invalidRows.push({ row: rowNum, data: r, reason: "Missing holiday name" });
        return;
      }

      const dateObj = new Date(r.date);
      if (isNaN(dateObj.getTime())) {
        invalidRows.push({ row: rowNum, data: r, reason: "Invalid date format (Use YYYY-MM-DD)" });
        return;
      }

      const year = dateObj.getFullYear();
      const dateKey = `${dateObj.toISOString().split("T")[0]}_${year}`;

      if (existingDatesMap.has(dateKey)) {
        invalidRows.push({ row: rowNum, data: r, reason: `Holiday already exists on ${r.date}` });
        return;
      }

      const normalizedType = (r.type || "NATIONAL").toUpperCase() as HolidayType;
      if (!["NATIONAL", "RESTRICTED", "COMPANY"].includes(normalizedType)) {
        invalidRows.push({ row: rowNum, data: r, reason: "Type must be National, Restricted, or Company" });
        return;
      }

      existingDatesMap.add(dateKey);
      validRows.push({
        name: r.name.trim(),
        date: dateObj,
        year,
        type: normalizedType,
        isOptional: Boolean(r.isOptional),
        description: r.description ?? null,
      });
    });

    if (validRows.length > 0) {
      await prisma.holiday.createMany({
        data: validRows.map((v) => ({
          name: v.name,
          date: v.date,
          year: v.year,
          type: v.type,
          isOptional: v.isOptional,
          description: v.description,
          createdById: createdById ?? null,
        })),
      });
    }

    return {
      importedCount: validRows.length,
      failedCount: invalidRows.length,
      invalidRows,
    };
  }
}

export const holidayService = new HolidayService();
