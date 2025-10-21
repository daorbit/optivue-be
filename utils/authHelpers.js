import User from '../models/User.js';
import { sendNotFound, sendError } from './responseHelpers.js';

/**
 * Authentication and user utilities
 */

/**
 * Find and validate user from request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object|null} - User object or null if not found/error sent
 */
export const findUserFromRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'User ID not found in request', 401);
      return null;
    }

    const user = await User.findById(userId);
    if (!user) {
      sendNotFound(res, 'User');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    sendError(res, 'Error retrieving user information', 500);
    return null;
  }
};

/**
 * Find user application by type
 * @param {Object} user - User object
 * @param {string} applicationType - Application type to find
 * @returns {Object|null} - Application object or null if not found
 */
export const findUserApplication = (user, applicationType) => {
  return user.applications.find(app => app.type === applicationType) || null;
};

/**
 * Validate application configuration
 * @param {Object} application - Application object
 * @param {Array} requiredFields - Array of required configuration field names
 * @returns {Object} - Validation result with isValid boolean and missingFields array
 */
export const validateApplicationConfig = (application, requiredFields) => {
  if (!application || !application.configuration) {
    return {
      isValid: false,
      missingFields: requiredFields,
      message: 'Application not configured'
    };
  }

  const missingFields = requiredFields.filter(field => 
    !application.configuration[field]
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `Missing required fields: ${missingFields.join(', ')}` 
      : null
  };
};

/**
 * Get user and validate application in one step
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} applicationType - Application type to validate
 * @param {Array} requiredFields - Required configuration fields
 * @returns {Object|null} - Object with user and application or null if validation failed
 */
export const getUserAndApplication = async (req, res, applicationType, requiredFields = []) => {
  const user = await findUserFromRequest(req, res);
  if (!user) return null;

  const application = findUserApplication(user, applicationType);
  if (!application) {
    sendError(res, `${applicationType} application not configured`, 400);
    return null;
  }

  if (requiredFields.length > 0) {
    const validation = validateApplicationConfig(application, requiredFields);
    if (!validation.isValid) {
      sendError(res, validation.message, 400);
      return null;
    }
  }

  return { user, application };
};

/**
 * Format user response (exclude sensitive data)
 * @param {Object} user - User object
 * @returns {Object} - Formatted user object
 */
export const formatUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    applications: user.applications,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};