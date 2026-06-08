"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = void 0;
class NotFoundError extends Error {
    statusCode = 404;
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends Error {
    statusCode = 409;
    details;
    constructor(message = 'Resource conflict', details) {
        super(message);
        this.name = 'ConflictError';
        if (details)
            this.details = details;
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    statusCode = 403;
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends Error {
    statusCode = 400;
    details;
    constructor(message = 'Validation error', details) {
        super(message);
        this.name = 'ValidationError';
        if (details)
            this.details = details;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class InternalServerError extends Error {
    statusCode = 500;
    constructor(message = 'Internal server error') {
        super(message);
        this.name = 'InternalServerError';
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=errors.js.map