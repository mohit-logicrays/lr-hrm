import { Request, Response } from "express";
import { departmentService } from "./department.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema,
} from "./department.schema";

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const query = departmentQuerySchema.parse(req.query);
  const result = await departmentService.list(query);
  ApiResponse.success(res, 200, "Departments fetched", result.data, result.pagination);
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getById(req.params.id);
  ApiResponse.success(res, 200, "Department fetched", department);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const body = createDepartmentSchema.parse(req.body);
  const department = await departmentService.create(body);
  ApiResponse.success(res, 201, "Department created", department);
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const body = updateDepartmentSchema.parse(req.body);
  const department = await departmentService.update(req.params.id, body);
  ApiResponse.success(res, 200, "Department updated", department);
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.remove(req.params.id);
  ApiResponse.success(res, 200, "Department deleted");
});
