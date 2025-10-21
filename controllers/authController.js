import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BaseController from './BaseController.js';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/responseHelpers.js';
import { findUserFromRequest } from '../utils/authHelpers.js';

/**
 * Authentication Controller
 * Handles user registration, login, and profile operations
 */
class AuthController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['signup', 'login', 'getProfile']);
  }

  /**
   * Generate JWT token for user
   * @param {string} userId - User ID
   * @returns {string} - JWT token
   */
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });
  }

  /**
   * Format user data for response
   * @param {Object} user - User object
   * @returns {Object} - Formatted user data
   */
  formatUserData(user) {
    return {
      id: user._id,
      username: user.username,
      email: user.email
    };
  }

  /**
   * Check if user already exists
   * @param {string} email - User email
   * @param {string} username - Username
   * @returns {Object|null} - Existing user or null
   */
  async checkExistingUser(email, username) {
    return await User.findOne({
      $or: [{ email }, { username }]
    });
  }

  /**
   * User signup
   */
  async signup(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.checkExistingUser(email, username);
      if (existingUser) {
        return sendError(res, 'User with this email or username already exists', 400);
      }

      // Create new user
      const user = new User({ username, email, password });
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      sendSuccess(res, {
        token,
        user: this.formatUserData(user)
      }, 'User created successfully', 201);
    }, req, res, 'Server error during signup');
  }

  /**
   * User login
   */
  async login(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return sendUnauthorized(res, 'Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return sendUnauthorized(res, 'Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(user._id);

      sendSuccess(res, {
        token,
        user: this.formatUserData(user)
      }, 'Login successful');
    }, req, res, 'Server error during login');
  }

  /**
   * Get current user profile (protected route)
   */
  async getProfile(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const user = await findUserFromRequest(req, res);
      if (!user) return; // Error already sent by findUserFromRequest

      // Remove password from response
      const userData = await User.findById(user._id).select('-password');
      sendSuccess(res, { user: userData });
    }, req, res, 'Server error retrieving profile');
  }
}

// Create instance and export methods
const authController = new AuthController();

export const signup = authController.signup;
export const login = authController.login;
export const getProfile = authController.getProfile;