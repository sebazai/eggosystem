export class BaseError extends Error {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "Base Error";
    this.status = status ?? 400;
  }
}

export class BadRequestError extends BaseError {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "Bad Request";
    this.status = status ?? 400;
  }
}

export class NotFoundError extends BaseError {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "Not Found";
    this.status = status ?? 404;
  }
}

export class UnauthorizedError extends BaseError {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "Unauthorized";
    this.status = status ?? 401;
  }
}
