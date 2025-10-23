import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BaseController from './BaseController.js';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/responseHelpers.js';
import { findUserFromRequest } from '../utils/authHelpers.js';
import emailService from '../utils/emailService.js';

/**
 * Authentication Controller
 * Handles user registration, login, and profile operations
 */
class AuthController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['signup', 'login', 'getProfile', 'verifyOtp', 'getOtp']);
    // In-memory OTP storage: email -> { otp, expiresAt, userId }
    this.otpStore = new Map();
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

      // Create new user (unverified)
      const user = new User({ username, email, password, isVerified: false });
      await user.save();

      // Generate and store OTP
      const otp = emailService.generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      this.otpStore.set(email, { otp, expiresAt, userId: user._id });

      // Send OTP email
      try {
        await emailService.sendOTPEmail(email, otp);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // For development, don't delete user if email fails
        // In production, you might want to handle this differently
        // await User.findByIdAndDelete(user._id);
        // return sendError(res, 'Failed to send verification email. Please try again.', 500);
      }

      sendSuccess(res, {
        message: 'Please check your email for the OTP to verify your account',
        email: email
      }, 'Signup successful. Please verify your email.', 201);
    }, req, res, 'Server error during signup');
  }

  /**
   * Verify OTP and activate user account
   */
  async verifyOtp(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { email, otp } = req.body;

      // Check if OTP exists for this email
      const otpData = this.otpStore.get(email);
      if (!otpData) {
        return sendError(res, 'No OTP found for this email. Please signup first.', 400);
      }

      // Check if OTP is expired
      if (Date.now() > otpData.expiresAt) {
        this.otpStore.delete(email);
        return sendError(res, 'OTP has expired. Please request a new one.', 400);
      }

      // Check if OTP matches
      if (otpData.otp !== otp) {
        return sendError(res, 'Invalid OTP. Please try again.', 400);
      }

      // Find and verify the user
      const user = await User.findById(otpData.userId);
      if (!user) {
        return sendError(res, 'User not found.', 404);
      }

      // Mark user as verified
      user.isVerified = true;
      await user.save();

      // Remove OTP from store
      this.otpStore.delete(email);

      // Generate token
      const token = this.generateToken(user._id);

      sendSuccess(res, {
        token,
        user: this.formatUserData(user)
      }, 'Email verified successfully. You are now logged in.');
    }, req, res, 'Server error during OTP verification');
  }

  /**
   * Get OTP for testing (development only)
   */
  async getOtp(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { email } = req.body;
      const otpData = this.otpStore.get(email);
      
      if (!otpData) {
        return sendError(res, 'No OTP found for this email', 404);
      }

      sendSuccess(res, { otp: otpData.otp }, 'OTP retrieved successfully');
    }, req, res, 'Server error retrieving OTP');
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

      // Check if user is verified
      if (!user.isVerified) {
        return sendError(res, 'Please verify your email before logging in.', 403);
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
export const verifyOtp = authController.verifyOtp;
export const getOtp = authController.getOtp;