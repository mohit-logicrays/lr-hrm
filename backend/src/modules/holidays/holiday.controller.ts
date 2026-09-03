import { Request, Response } from "express";
import { holidayService } from "./holiday.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createHolidaySchema,
  updateHolidaySchema,
  holidayQuerySchema,
  importHolidayPayloadSchema,
} from "./holiday.schema";

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const query = holidayQuerySchema.parse(req.query);
  const result = await holidayService.list(query);
  ApiResponse.success(res, 200, "Holidays fetched", result.data, result.pagination);
});

export const getWorkingDaysConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = holidayService.getWorkingDaysConfig();
  ApiResponse.success(res, 200, "Working days config fetched", config);
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const body = createHolidaySchema.parse(req.body);
  const holiday = await holidayService.create(body, req.user?.id);
  ApiResponse.success(res, 201, "Holiday created", holiday);
});

export const updateHoliday = asyncHandler(async (req: Request, res: Response) => {
  const body = updateHolidaySchema.parse(req.body);
  const holiday = await holidayService.update(req.params.id, body);
  ApiResponse.success(res, 200, "Holiday updated", holiday);
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  await holidayService.remove(req.params.id);
  ApiResponse.success(res, 200, "Holiday deleted");
});

export const getUpcomingHolidays = asyncHandler(async (req: Request, res: Response) => {
  const upcoming = await holidayService.getUpcoming();
  ApiResponse.success(res, 200, "Upcoming holidays fetched", upcoming);
});

export const downloadTemplate = asyncHandler(async (req: Request, res: Response) => {
  const csv = holidayService.getTemplateCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="holiday_import_template.csv"');
  res.status(200).send(csv);
});

export const importHolidays = asyncHandler(async (req: Request, res: Response) => {
  const body = importHolidayPayloadSchema.parse(req.body);
  const result = await holidayService.importBulk(body.holidays, req.user?.id);
  ApiResponse.success(res, 200, "Holidays imported successfully", result);
});
