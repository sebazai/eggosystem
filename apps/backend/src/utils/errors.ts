export class BaseError extends Error {
  status: number;
  /** Optional RFC 7807 title override */
  title?: string;

  constructor(message: string, status?: number, title?: string) {
    super(message);
    this.name = "Base Error";
    this.status = status ?? 400;
    this.title = title;
  }
}

export class BadRequestError extends BaseError {
  status: number;

  constructor(message: string, status?: number, title?: string) {
    super(message, status ?? 400, title ?? "Bad Request");
    this.name = "Bad Request";
    this.status = status ?? 400;
  }
}

export class NotFoundError extends BaseError {
  status: number;

  constructor(message: string, status?: number, title?: string) {
    super(message, status ?? 404, title ?? "Not Found");
    this.name = "Not Found";
    this.status = status ?? 404;
  }
}

export class UnauthorizedError extends BaseError {
  status: number;

  constructor(message: string, status?: number, title?: string) {
    super(message, status ?? 401, title ?? "Unauthorized");
    this.name = "Unauthorized";
    this.status = status ?? 401;
  }
}

export class ForbiddenError extends BaseError {
  status: number;

  constructor(message: string, status?: number, title?: string) {
    super(message, status ?? 403, title ?? "Forbidden");
    this.name = "Forbidden";
    this.status = status ?? 403;
  }
}

export class ConflictError extends BaseError {
  status: number;

  constructor(message: string, status?: number, title?: string) {
    super(message, status ?? 409, title ?? "Conflict");
    this.name = "Conflict";
    this.status = status ?? 409;
  }
}

export class InternalServerError extends BaseError {
  status: number;

  constructor(message: string, status?: number, title?: string) {
    super(message, status ?? 500, title ?? "Internal Server Error");
    this.name = "Internal Server Error";
    this.status = status ?? 500;
  }
}
