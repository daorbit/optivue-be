import BaseController from '../BaseController.js';
import { sendSuccess, sendError } from '../../utils/responseHelpers.js';
import { getUserAndApplication } from '../../utils/authHelpers.js';
import facebookAdsService from '../../utils/facebookAdsService.js';

/**
 * Facebook Ads Account Controller
 * Handles Facebook Ads account related operations
 */
class FacebookAdsAccountController extends BaseController {
  constructor() {
    super();
    this.applicationType = 'FACEBOOK_INSIGHTS';
    this.requiredFields = ['accountId', 'accessToken'];
    this.bindMethods(['getAdAccount']);
  }

  /**
   * Get Facebook Ads account info
   */
  async getAdAccount(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const result = await getUserAndApplication(
        req, res, 
        this.applicationType, 
        this.requiredFields
      );
      if (!result) return; // Error already sent

      const { accountId, accessToken } = result.application.configuration;
      const serviceResult = await facebookAdsService.getAdAccount(accountId, accessToken);

      if (!serviceResult.success) {
        return sendError(res, serviceResult.error, 400);
      }

      sendSuccess(res, serviceResult.data);
    }, req, res, 'Server error retrieving ad account');
  }
}

// Create instance and export methods
const facebookAdsAccountController = new FacebookAdsAccountController();

export const getAdAccount = facebookAdsAccountController.getAdAccount;