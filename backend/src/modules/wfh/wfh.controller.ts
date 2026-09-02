import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { wfhService } from "./wfh.service";
import { createWFHSchema, approveWFHSchema, rejectWFHSchema } from "./wfh.schema";

export const applyWFH = asyncHandler(async (req: Request, res: Response) => {
  const body = createWFHSchema.parse(req.body);
  const result = await wfhService.create(req.user!.id, body);
  ApiResponse.success(res, 201, "WFH request submitted successfully", result);
});

export const listMyWFH = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
  const status = req.query.status as string | undefined;
  const result = await wfhService.listMy(req.user!.id, page, pageSize, status);
  res.status(200).json({
    success: true,
    message: "My WFH requests fetched",
    data: result.data,
    pagination: {
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      totalPages: result.pagination.totalPages,
      hasPrevious: result.pagination.hasPrevPage,
      hasNext: result.pagination.hasNextPage,
      previous: result.pagination.hasPrevPage ? page - 1 : null,
      next: result.pagination.hasNextPage ? page + 1 : null,
    },
  });
});

export const listApprovals = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const departmentId = req.query.departmentId as string | undefined;
  const data = await wfhService.listApprovals(req.user!.id, req.user!.roleName, req.user!.isSpecialRole, { status, search, departmentId });
  ApiResponse.success(res, 200, "WFH approvals fetched", data);
});

export const approveWFH = asyncHandler(async (req: Request, res: Response) => {
  const body = approveWFHSchema.parse(req.body);
  const result = await wfhService.approve(req.params.id, req.user!.id, req.user!.roleName, req.user!.isSpecialRole, body.comment);
  ApiResponse.success(res, 200, "WFH request approved", result);
});

export const rejectWFH = asyncHandler(async (req: Request, res: Response) => {
  const body = rejectWFHSchema.parse(req.body);
  const result = await wfhService.reject(req.params.id, req.user!.id, req.user!.roleName, req.user!.isSpecialRole, body.reason);
  ApiResponse.success(res, 200, "WFH request rejected", result);
});

export const cancelWFH = asyncHandler(async (req: Request, res: Response) => {
  const result = await wfhService.cancel(req.params.id, req.user!.id);
  ApiResponse.success(res, 200, "WFH request cancelled", result);
});

export const getWFHLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await wfhService.getLogs(req.params.id);
  ApiResponse.success(res, 200, "WFH approval logs fetched", logs);
});
