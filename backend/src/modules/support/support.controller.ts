import { Request, Response } from "express";
import { supportService } from "./support.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
  createTicketCommentSchema,
} from "./support.schema";
import { AppError } from "../../utils/AppError";

export const listTickets = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const query = ticketQuerySchema.parse(req.query);
  const result = await supportService.list({ id: req.user.id, roleName: req.user.roleName }, query);
  ApiResponse.success(res, 200, "Support tickets fetched", result.data, result.pagination);
});

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const ticket = await supportService.getById(req.params.id, { id: req.user.id, roleName: req.user.roleName });
  ApiResponse.success(res, 200, "Support ticket fetched", ticket);
});

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createTicketSchema.parse(req.body);
  const ticket = await supportService.create(req.user.id, body);
  ApiResponse.success(res, 201, "Support ticket created successfully", ticket);
});

export const updateTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateTicketSchema.parse(req.body);
  const ticket = await supportService.update(
    req.params.id,
    { id: req.user.id, roleName: req.user.roleName },
    body
  );
  ApiResponse.success(res, 200, "Support ticket updated", ticket);
});

export const addTicketComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createTicketCommentSchema.parse(req.body);
  const comment = await supportService.addComment(req.params.id, req.user.id, body);
  ApiResponse.success(res, 201, "Ticket comment added", comment);
});

export const deleteTicket = asyncHandler(async (req: Request, res: Response) => {
  await supportService.remove(req.params.id);
  ApiResponse.success(res, 200, "Support ticket deleted");
});
