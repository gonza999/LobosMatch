class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Error de validación', details = []) {
    super(message, 400);
    this.details = details;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con recurso existente') {
    super(message, 409);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Demasiadas solicitudes') {
    super(message, 429);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  TooManyRequestsError,
};
