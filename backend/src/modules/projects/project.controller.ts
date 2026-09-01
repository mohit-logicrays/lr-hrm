import { Request, Response } from "express";
import { projectService } from "./project.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  addMemberSchema,
  updateMemberSchema,
} from "./project.schema";

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const query = projectQuerySchema.parse(req.query);
  const result = await projectService.list(query);
  ApiResponse.success(res, 200, "Projects fetched", result.data, result.pagination);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getById(req.params.id);
  ApiResponse.success(res, 200, "Project fetched", project);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const body = createProjectSchema.parse(req.body);
  const project = await projectService.create(body, req.user?.id);
  ApiResponse.success(res, 201, "Project created", project);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const body = updateProjectSchema.parse(req.body);
  const project = await projectService.update(req.params.id, body);
  ApiResponse.success(res, 200, "Project updated", project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.remove(req.params.id);
  ApiResponse.success(res, 200, "Project deleted");
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const body = addMemberSchema.parse(req.body);
  const member = await projectService.addMember(body);
  ApiResponse.success(res, 201, "Member added to project", member);
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  const body = updateMemberSchema.parse(req.body);
  const member = await projectService.updateMember(req.params.projectId, req.params.userId, body);
  ApiResponse.success(res, 200, "Project member updated", member);
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeMember(req.params.projectId, req.params.userId);
  ApiResponse.success(res, 200, "Member removed from project");
});
