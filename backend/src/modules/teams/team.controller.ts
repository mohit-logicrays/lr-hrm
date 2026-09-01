import { Request, Response } from "express";
import { teamService } from "./team.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createTeamSchema,
  updateTeamSchema,
  teamQuerySchema,
  addMemberSchema,
  updateMemberSchema,
} from "./team.schema";

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
  const query = teamQuerySchema.parse(req.query);
  const result = await teamService.list(query);
  ApiResponse.success(res, 200, "Teams fetched", result.data, result.pagination);
});

export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const team = await teamService.getById(req.params.id);
  ApiResponse.success(res, 200, "Team fetched", team);
});

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const body = createTeamSchema.parse(req.body);
  const team = await teamService.create(body);
  ApiResponse.success(res, 201, "Team created", team);
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTeamSchema.parse(req.body);
  const team = await teamService.update(req.params.id, body);
  ApiResponse.success(res, 200, "Team updated", team);
});

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  await teamService.remove(req.params.id);
  ApiResponse.success(res, 200, "Team deleted");
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const body = addMemberSchema.parse(req.body);
  const member = await teamService.addMember(body);
  ApiResponse.success(res, 201, "Member added to team", member);
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  const body = updateMemberSchema.parse(req.body);
  const member = await teamService.updateMember(req.params.teamId, req.params.userId, body);
  ApiResponse.success(res, 200, "Team member updated", member);
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await teamService.removeMember(req.params.teamId, req.params.userId);
  ApiResponse.success(res, 200, "Member removed from team");
});
