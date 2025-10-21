import BaseController from './BaseController.js';
import { sendSuccess } from '../utils/responseHelpers.js';
import { findUserFromRequest, formatUserResponse } from '../utils/authHelpers.js';

/**
 * Account Controller
 * Handles user account operations
 */
class AccountController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['getAccount', 'updateAccount']);
  }

  /**
   * Get account information
   */
  async getAccount(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const user = await findUserFromRequest(req, res);
      if (!user) return; // Error already sent by findUserFromRequest

      sendSuccess(res, { user: formatUserResponse(user) });
    }, req, res, 'Server error retrieving account');
  }

  /**
   * Update account information
   */
  async updateAccount(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { username, applications } = req.body;

      const user = await findUserFromRequest(req, res);
      if (!user) return; // Error already sent by findUserFromRequest

      // Update fields if provided (email cannot be updated)
      if (username !== undefined) user.username = username;
      if (applications !== undefined) user.applications = applications;

      await user.save();

      sendSuccess(res, { 
        user: formatUserResponse(user) 
      }, 'Account updated successfully');
    }, req, res, 'Server error updating account');
  }
}

// Create instance and export methods
const accountController = new AccountController();

export const getAccount = accountController.getAccount;
export const updateAccount = accountController.updateAccount;