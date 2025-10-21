import { validationResult } from 'express-validator';
import { sendValidationError, sendServerError } from '../utils/responseHelpers.js';

/**
 * Base controller class with common functionality
 */
export default class BaseController {
  /**
   * Handle validation errors from express-validator
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {boolean} - True if validation errors exist, false otherwise
   */
  handleValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return true;
    }
    return false;
  }

  /**
   * Execute a controller method with error handling
   * @param {Function} controllerMethod - The controller method to execute
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} errorMessage - Custom error message for server errors
   */
  async executeWithErrorHandling(controllerMethod, req, res, errorMessage = 'Server error') {
    try {
      // Check for validation errors first
      if (this.handleValidationErrors(req, res)) {
        return;
      }

      // Execute the controller method
      await controllerMethod.call(this, req, res);
    } catch (error) {
      sendServerError(res, error, errorMessage);
    }
  }

  /**
   * Get user ID from authenticated request
   * @param {Object} req - Express request object
   * @returns {string} - User ID
   */
  getUserId(req) {
    return req.user?.userId;
  }

  /**
   * Extract query parameters with defaults
   * @param {Object} query - Express query object
   * @param {Object} defaults - Default values
   * @returns {Object} - Merged query parameters
   */
  extractQueryParams(query, defaults = {}) {
    return { ...defaults, ...query };
  }

  /**
   * Bind methods to maintain 'this' context
   * @param {Array} methods - Array of method names to bind
   */
  bindMethods(methods) {
    methods.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }
}