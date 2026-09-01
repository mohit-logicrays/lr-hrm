import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    pagination?: PaginationMeta
  ): Response {
    const body: Record<string, unknown> = { success: true, message };
    if (data !== undefined) body.data = data;
    if (pagination) {
      body.pagination = {
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages: pagination.totalPages,
        hasPrevious: pagination.hasPrevPage,
        hasNext: pagination.hasNextPage,
        previous: pagination.hasPrevPage ? pagination.page - 1 : null,
        next: pagination.hasNextPage ? pagination.page + 1 : null,
      };
    }
    return res.status(statusCode).json(body);
  }

  static error(
    res: Response,
    statusCode: number,
    message: string,
    details?: unknown
  ): Response {
    const body: Record<string, unknown> = { success: false, message };
    if (details !== undefined) body.details = details;
    return res.status(statusCode).json(body);
  }
}
