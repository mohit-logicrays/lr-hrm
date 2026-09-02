import { Request, Response } from "express";
import { projectService } from "./project.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  addMemberSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createCommentSchema,
} from "./project.schema";

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const query = projectQuerySchema.parse(req.query);
  const result = await projectService.list({
    ...query,
    userId: req.user?.id,
    userRole: req.user?.roleName,
    isSpecialRole: req.user?.isSpecialRole,
  });
  ApiResponse.success(res, 200, "Projects fetched", result.data, result.pagination);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getById(req.params.id);
  ApiResponse.success(res, 200, "Project fetched", project);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const body = createProjectSchema.parse(req.body);
  const project = await projectService.create(body, req.user?.id);
  ApiResponse.success(res, 201, "Project created successfully", project);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const body = updateProjectSchema.parse(req.body);
  const project = await projectService.update(req.params.id, body, req.user?.id);
  ApiResponse.success(res, 200, "Project updated successfully", project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.remove(req.params.id, req.user?.id);
  ApiResponse.success(res, 200, "Project deleted successfully");
});

// ---------- Members ----------
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const body = addMemberSchema.parse(req.body);
  const member = await projectService.addMember(req.params.id, body, req.user?.id);
  ApiResponse.success(res, 201, "Member added to project", member);
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeMember(req.params.id, req.params.userId, req.user?.id);
  ApiResponse.success(res, 200, "Member removed from project");
});

// ---------- Tasks ----------
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await projectService.listTasks(req.params.id);
  ApiResponse.success(res, 200, "Tasks fetched", tasks);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const body = createTaskSchema.parse(req.body);
  const task = await projectService.createTask(req.params.id, body, req.user?.id);
  ApiResponse.success(res, 201, "Task created successfully", task);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTaskSchema.parse(req.body);
  const task = await projectService.updateTask(req.params.taskId, body, req.user?.id);
  ApiResponse.success(res, 200, "Task updated successfully", task);
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTaskStatusSchema.parse(req.body);
  const task = await projectService.updateTaskStatus(req.params.taskId, body.status, req.user?.id);
  ApiResponse.success(res, 200, "Task status updated", task);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteTask(req.params.taskId, req.user?.id);
  ApiResponse.success(res, 200, "Task deleted successfully");
});

// ---------- Milestones ----------
export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
  const body = createMilestoneSchema.parse(req.body);
  const milestone = await projectService.createMilestone(req.params.id, body);
  ApiResponse.success(res, 201, "Milestone created successfully", milestone);
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
  const body = updateMilestoneSchema.parse(req.body);
  const milestone = await projectService.updateMilestone(req.params.milestoneId, body);
  ApiResponse.success(res, 200, "Milestone updated successfully", milestone);
});

// ---------- Comments ----------
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const body = createCommentSchema.parse(req.body);
  const comment = await projectService.addComment(req.params.taskId, body.content, req.user!.id);
  ApiResponse.success(res, 201, "Comment added successfully", comment);
});

export const getTaskComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await projectService.getTaskComments(req.params.taskId);
  ApiResponse.success(res, 200, "Comments fetched", comments);
});
