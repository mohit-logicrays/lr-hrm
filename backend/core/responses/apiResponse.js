/**
 * Common response module — every API response goes through these helpers,
 * guaranteeing a consistent envelope across all status codes.
 *
 * Single object : { success, message, data }
 * List          : { success, message, data, pagination }
 * Empty         : 204 — no body
 */

import { PAGINATION } from "../constants/constants.js";

export function sendSuccess(res, { statusCode = 200, message = "Success", data = null }) {
  if (statusCode === 204) return sendNoContent(res);
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendCreated(res, { message = "Resource created", data = null }) {
  return res.status(201).json({ success: true, message, data });
}

/** 204 No Content — empty body by HTTP spec */
export function sendNoContent(res) {
  return res.status(204).end();
}

export function sendError(res, {
  statusCode = 500,
  message = "Internal server error",
  details = null,
}) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Paginated list response.
 * @param {Array} items - page of data
 * @param {number} total - total matching documents
 * @param {object} query - { page, pageSize } from request
 */
export function sendList(res, {
  items,
  total,
  page,
  pageSize,
  message = "Success",
}) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasPrevious,
      hasNext,
      previous: hasPrevious ? page - 1 : null,
      next: hasNext ? page + 1 : null,
    },
  });
}

/** Middleware: parses + clamps pagination params from req.query into req.pagination */
export function getPaginationParams(req, res, next) {
  const q = req.query || {};
  let page = parseInt(q.page, 10);
  let pageSize = parseInt(q.pageSize ?? q.page_size, 10);

  if (!page || page < 1) page = PAGINATION.DEFAULT_PAGE;
  if (!pageSize || pageSize < 1) pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
  pageSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);

  req.pagination = { page, pageSize, skip: (page - 1) * pageSize, limit: pageSize };
  next();
}
