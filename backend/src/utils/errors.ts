export class NotFoundError extends Error {
  statusCode: number = 404
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends Error {
  statusCode: number = 409
  details?: any
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message)
    this.name = 'ConflictError'
    if (details) this.details = details
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class UnauthorizedError extends Error {
  statusCode: number = 401
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class ForbiddenError extends Error {
  statusCode: number = 403
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class ValidationError extends Error {
  statusCode: number = 400
  details?: any
  constructor(message: string = 'Validation error', details?: any) {
    super(message)
    this.name = 'ValidationError'
    if (details) this.details = details
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class InternalServerError extends Error {
  statusCode: number = 500
  constructor(message: string = 'Internal server error') {
    super(message)
    this.name = 'InternalServerError'
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}
