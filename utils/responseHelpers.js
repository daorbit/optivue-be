/**
 * Utility functions for standardized API responses
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  // If data is provided, spread it into the response instead of wrapping it
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    Object.assign(response, data);
  } else if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {any} errors - Validation errors or additional error details
 */
export const sendError = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors from express-validator
 */
export const sendValidationError = (res, errors) => {
  return sendError(res, 'Validation failed', 400, errors);
};

/**
 * Send server error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} message - Custom error message
 */
export const sendServerError = (res, error, message = 'Server error') => {
  console.error(`${message}:`, error);
  return sendError(res, message, 500);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Name of the resource that wasn't found
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401);
};