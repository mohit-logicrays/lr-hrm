import { Request, Response } from "express";
import { policyService } from "./policy.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createPolicySchema,
  updatePolicySchema,
  policyQuerySchema,
} from "./policy.schema";
import { AppError } from "../../utils/AppError";

export const listPolicies = asyncHandler(async (req: Request, res: Response) => {
  const query = policyQuerySchema.parse(req.query);
  const result = await policyService.list({ ...query, userId: req.user?.id });
  ApiResponse.success(res, 200, "Policies fetched", result.data, result.pagination);
});

export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy = await policyService.getById(req.params.id, req.user?.id);
  ApiResponse.success(res, 200, "Policy fetched", policy);
});

export const getPolicyAcknowledgments = asyncHandler(async (req: Request, res: Response) => {
  const stats = await policyService.getAcknowledgmentStats(req.params.id);
  ApiResponse.success(res, 200, "Policy acknowledgments fetched", stats);
});

export const createPolicy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createPolicySchema.parse(req.body);
  const policy = await policyService.create(req.user.id, body);
  ApiResponse.success(res, 201, "Policy created successfully", policy);
});

export const updatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const body = updatePolicySchema.parse(req.body);
  const policy = await policyService.update(req.params.id, body);
  ApiResponse.success(res, 200, "Policy updated", policy);
});

export const acknowledgePolicy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  await policyService.acknowledge(req.params.id, req.user.id);
  ApiResponse.success(res, 200, "Policy acknowledged");
});

export const deletePolicy = asyncHandler(async (req: Request, res: Response) => {
  await policyService.remove(req.params.id);
  ApiResponse.success(res, 200, "Policy deleted");
});
