import { Request, Response } from "express";
import { holidayService } from "./holiday.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createHolidaySchema,
  updateHolidaySchema,
  holidayQuerySchema,
} from "./holiday.schema";

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const query = holidayQuerySchema.parse(req.query);
  const result = await holidayService.list(query);
  ApiResponse.success(res, 200, "Holidays fetched", result.data, result.pagination);
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const body = createHolidaySchema.parse(req.body);
  const holiday = await holidayService.create(body);
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
