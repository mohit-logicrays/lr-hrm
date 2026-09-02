import { Request, Response } from "express";
import { timeService } from "./time.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createTimeLogSchema,
  updateTimeLogSchema,
  timeQuerySchema,
  approveTimeLogSchema,
  bulkApproveTimeLogSchema,
  submitWeekSchema,
} from "./time.schema";
import { AppError } from "../../utils/AppError";

export const listTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = timeQuerySchema.parse(req.query);
  const result = await timeService.list(query);
  ApiResponse.success(res, 200, "Time logs fetched", result.data, result.pagination);
});

export const myTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const query = timeQuerySchema.parse(req.query);
  const result = await timeService.myLogs(req.user.id, query);
  ApiResponse.success(res, 200, "My time logs fetched", result.data, result.pagination);
});

export const mySummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const summary = await timeService.mySummary(req.user.id, from, to);
  ApiResponse.success(res, 200, "Timesheet summary fetched", summary);
});

export const createTimeLog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createTimeLogSchema.parse(req.body);
  const log = await timeService.create(req.user.id, body);
  ApiResponse.success(res, 201, "Time log created", log);
});

export const getTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const log = await timeService.getById(req.params.id);
  ApiResponse.success(res, 200, "Time log fetched", log);
});

export const updateTimeLog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateTimeLogSchema.parse(req.body);
  const log = await timeService.update(
    req.params.id,
    { id: req.user.id, roleName: req.user.roleName },
    body
  );
  ApiResponse.success(res, 200, "Time log updated", log);
});

export const deleteTimeLog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  await timeService.remove(req.params.id, {
    id: req.user.id,
    roleName: req.user.roleName,
  });
  ApiResponse.success(res, 200, "Time log deleted");
});

export const submitWeek = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = submitWeekSchema.parse(req.body);
  const result = await timeService.submitWeek(req.user.id, body.from, body.to);
  ApiResponse.success(res, 200, "Weekly timesheet submitted for approval", result);
});

export const approveTimeLog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = approveTimeLogSchema.parse(req.body);
  const log = await timeService.approve(req.params.id, req.user.id, body.status, body.rejectionReason);
  ApiResponse.success(res, 200, `Time log ${body.status.toLowerCase()}`, log);
});

export const bulkApproveTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = bulkApproveTimeLogSchema.parse(req.body);
  const result = await timeService.bulkApprove(req.user.id, body.ids, body.status, body.rejectionReason);
  ApiResponse.success(res, 200, `Selected timesheets ${body.status.toLowerCase()}`, result);
});

export const getTimeReports = asyncHandler(async (req: Request, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const reports = await timeService.getReports(from, to);
  ApiResponse.success(res, 200, "Timesheet analytics & reports fetched", reports);
});
