/**
 * Centralized Error Handler
 * Provides consistent error responses across the application
 */

const { ERROR_MESSAGES } = require('./constants');

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle async errors in route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Send error response
 */
const sendErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message: message || ERROR_MESSAGES.SERVER_ERROR
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.message;
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Handle validation errors
 */
const handleValidationError = (errors) => {
  return {
    success: false,
    message: ERROR_MESSAGES.VALIDATION_ERROR,
    errors: errors.array()
  };
};

/**
 * Handle MongoDB duplicate key error
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyPattern)[0];
  return {
    success: false,
    message: `${field} already exists`,
    field
  };
};

/**
 * Handle MongoDB cast error
 */
const handleCastError = (error) => {
  return {
    success: false,
    message: `Invalid ${error.path}: ${error.value}`
  };
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = handleCastError(err);
    return sendErrorResponse(res, 400, message.message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = handleDuplicateKeyError(err);
    return sendErrorResponse(res, 400, message.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return sendErrorResponse(res, 400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendErrorResponse(res, 401, ERROR_MESSAGES.INVALID_TOKEN);
  }

  if (err.name === 'TokenExpiredError') {
    return sendErrorResponse(res, 401, 'Token expired. Please login again.');
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || ERROR_MESSAGES.SERVER_ERROR;
  
  return sendErrorResponse(res, statusCode, message, err);
};

module.exports = {
  AppError,
  asyncHandler,
  sendErrorResponse,
  handleValidationError,
  globalErrorHandler
};

