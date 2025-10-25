import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import BaseController from './BaseController.js';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/responseHelpers.js';
import { findUserFromRequest } from '../utils/authHelpers.js';
import emailService from '../utils/emailService.js';
import googleAuthService from '../utils/googleAuthService.js';

/**
 * Authentication Controller
 * Handles user registration, login, and profile operations
 */
class AuthController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['signup', 'login', 'getProfile', 'verifyOtp', 'getOtp', 'googleAuth', 'googleCallback', 'forgotPassword', 'resetPassword']);
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

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not for security
        return sendSuccess(res, { message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Set token and expiry (1 hour)
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      // Send reset email
      try {
        await emailService.sendResetPasswordEmail(email, resetToken);
      } catch (emailError) {
        console.error('Reset password email sending failed:', emailError.message);
        // Reset the token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return sendError(res, 'Failed to send reset email. Please try again.', 500);
      }

      sendSuccess(res, { message: 'If an account with that email exists, a password reset link has been sent.' });
    }, req, res, 'Server error during password reset request');
  }

  /**
   * Reset password with token
   */
  async resetPassword(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { token, password } = req.body;

      // Hash the token to compare with stored hash
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return sendError(res, 'Invalid or expired reset token', 400);
      }

      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Generate new token for immediate login
      const authToken = this.generateToken(user._id);

      sendSuccess(res, {
        token: authToken,
        user: this.formatUserData(user)
      }, 'Password reset successful. You are now logged in.');
    }, req, res, 'Server error during password reset');
  }

  /**
   * Initiate Google OAuth flow
   */
  async googleAuth(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const authUrl = googleAuthService.getAuthUrl();
      sendSuccess(res, { authUrl }, 'Google authentication URL generated');
    }, req, res, 'Server error initiating Google authentication');
  }

  /**
   * Handle Google OAuth callback
   */
  async googleCallback(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { code } = req.body;

      if (!code) {
        return sendError(res, 'Authorization code is required', 400);
      }

      // Get user info from Google
      const googleUser = await googleAuthService.authenticateWithCode(code);

      // Check if user already exists
      let user = await User.findOne({ 
        $or: [
          { googleId: googleUser.id },
          { email: googleUser.email }
        ]
      });

      if (user) {
        // User exists - update Google ID if not set
        if (!user.googleId) {
          user.googleId = googleUser.id;
          user.authProvider = 'google';
          user.isVerified = true;
          if (googleUser.picture) {
            user.profilePicture = googleUser.picture;
          }
          await user.save();
        }
      } else {
        // Create new user
        user = new User({
          username: googleUser.email.split('@')[0] + '_' + Date.now(), // Generate unique username
          email: googleUser.email,
          googleId: googleUser.id,
          profilePicture: googleUser.picture || '',
          authProvider: 'google',
          isVerified: true, // Google accounts are pre-verified
          password: Math.random().toString(36).slice(-8) // Random password (won't be used)
        });
        await user.save();
      }

      // Generate JWT token
      const token = this.generateToken(user._id);

      sendSuccess(res, {
        token,
        user: this.formatUserData(user)
      }, 'Google authentication successful');
    }, req, res, 'Server error during Google authentication');
  }
}

// Create instance and export methods
const authController = new AuthController();

export const signup = authController.signup;
export const login = authController.login;
export const getProfile = authController.getProfile;
export const verifyOtp = authController.verifyOtp;
export const getOtp = authController.getOtp;
export const googleAuth = authController.googleAuth;
export const googleCallback = authController.googleCallback;
export const forgotPassword = authController.forgotPassword;
export const resetPassword = authController.resetPassword;