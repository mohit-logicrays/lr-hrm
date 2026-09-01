import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { leaveService } from "./leave.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  leaveTypeQuerySchema,
  createLeaveRequestSchema,
  leaveRequestQuerySchema,
  approveLeaveSchema,
  allocateLeaveSchema,
  updateBalanceSchema,
} from "./leave.schema";

// ---------- Leave Types ----------
export const listLeaveTypes = asyncHandler(async (req: Request, res: Response) => {
  const query = leaveTypeQuerySchema.parse(req.query);
  const result = await leaveService.listTypes(query);
  ApiResponse.success(res, 200, "Leave types fetched", result.data, result.pagination);
});

export const createLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const body = createLeaveTypeSchema.parse(req.body);
  const type = await leaveService.createType(body);
  ApiResponse.success(res, 201, "Leave type created", type);
});

export const updateLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const body = updateLeaveTypeSchema.parse(req.body);
  const type = await leaveService.updateType(req.params.id, body);
  ApiResponse.success(res, 200, "Leave type updated", type);
});

export const deleteLeaveType = asyncHandler(async (req: Request, res: Response) => {
  await leaveService.removeType(req.params.id);
  ApiResponse.success(res, 200, "Leave type deleted");
});

// ---------- Leave Requests ----------
export const listLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const query = leaveRequestQuerySchema.parse(req.query);
  const result = await leaveService.listRequests(query);
  ApiResponse.success(res, 200, "Leave requests fetched", result.data, result.pagination);
});

export const myLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const query = leaveRequestQuerySchema.parse(req.query);
  const result = await leaveService.myRequests(req.user.id, query);
  ApiResponse.success(res, 200, "My leave requests fetched", result.data, result.pagination);
});

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createLeaveRequestSchema.parse(req.body);
  const request = await leaveService.createRequest(req.user.id, body);
  ApiResponse.success(res, 201, "Leave request created", request);
});

export const approveLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = approveLeaveSchema.parse(req.body);
  const request = await leaveService.approve(req.params.id, req.user.id, body.status);
  ApiResponse.success(res, 200, `Leave request ${body.status.toLowerCase()}`, request);
});

export const cancelLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const request = await leaveService.cancel(req.user.id, req.params.id);
  ApiResponse.success(res, 200, "Leave request cancelled", request);
});

// ---------- Balances ----------
export const getMyBalance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const year = req.query.year ? Number(req.query.year) : undefined;
  const result = await leaveService.getBalance(req.user.id, year);
  ApiResponse.success(res, 200, "Leave balances fetched", result);
});

export const getUserBalance = asyncHandler(async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const result = await leaveService.getBalance(req.params.userId, year);
  ApiResponse.success(res, 200, "Leave balances fetched", result);
});

export const allocateLeave = asyncHandler(async (req: Request, res: Response) => {
  const body = allocateLeaveSchema.parse(req.body);
  const balance = await leaveService.allocateBalance(body);
  ApiResponse.success(res, 201, "Leave balance allocated", balance);
});

export const updateBalance = asyncHandler(async (req: Request, res: Response) => {
  const body = updateBalanceSchema.parse(req.body);
  const existing = await prisma.leaveBalance.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, "Leave balance not found");
  const balance = await prisma.leaveBalance.update({
    where: { id: req.params.id },
    data: { allocated: body.allocated },
  });
  ApiResponse.success(res, 200, "Leave balance updated", balance);
});
