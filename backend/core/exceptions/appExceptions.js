/**
 * Typed application exceptions — throw these anywhere; the centralized
 * error handler converts them into consistent API responses.
 */

export class AppException extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends AppException {
  constructor(message = "Bad request", details = null) {
    super(400, message, details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = "Authentication required") {
    super(401, message);
  }
}

export class ForbiddenException extends AppException {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message);
  }
}

export class NotFoundException extends AppException {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

export class ConflictException extends AppException {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

export class InternalServerException extends AppException {
  constructor(message = "Internal server error") {
    super(500, message);
  }
}
