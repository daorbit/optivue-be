import BaseController from '../BaseController.js';
import { sendSuccess, sendError } from '../../utils/responseHelpers.js';
import { getUserAndApplication } from '../../utils/authHelpers.js';
import facebookAdsService from '../../utils/facebookAdsService.js';

/**
 * Facebook Ads Overview Controller
 * Handles comprehensive Facebook Ads data aggregation
 */
class FacebookAdsOverviewController extends BaseController {
  constructor() {
    super();
    this.applicationType = 'FACEBOOK_INSIGHTS';
    this.requiredFields = ['accountId', 'accessToken'];
    this.bindMethods(['getAdsOverview']);
  }

  /**
   * Normalize account data to ensure proper ID formatting
   * @param {Object} account - Account data
   * @returns {Object} - Normalized account data
   */
  normalizeAccount(account) {
    if (!account) return account;
    
    const normalized = { ...account };
    
    // Ensure account.id and account.account_id have 'act_' prefix
    if (normalized.account_id && !String(normalized.account_id).startsWith('act_')) {
      normalized.account_id = `act_${normalized.account_id}`;
    }
    if (normalized.id && !String(normalized.id).startsWith('act_')) {
      normalized.id = String(normalized.id).startsWith('act_') 
        ? normalized.id 
        : `act_${normalized.id.replace(/^act_?/, '')}`;
    }
    
    return normalized;
  }

  /**
   * Get comprehensive Facebook Ads data
   */
  async getAdsOverview(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      console.log('Getting ads overview for user:', this.getUserId(req));

      const result = await getUserAndApplication(
        req, res, 
        this.applicationType, 
        this.requiredFields
      );
      if (!result) return; // Error already sent

      const { accountId, accessToken } = result.application.configuration;
      console.log('Account ID:', accountId);
      console.log('Access token exists:', !!accessToken);

      // Get comprehensive data: account info, campaigns with insights, and ads with creatives
      console.log('Making API calls to Facebook...');
      const [accountResult, campaignsResult, adsResult] = await Promise.all([
        facebookAdsService.getAdAccount(accountId, accessToken),
        facebookAdsService.getCampaignsWithInsights(accountId, accessToken, req.query),
        facebookAdsService.getAdsWithCreatives(accountId, accessToken, req.query)
      ]);

      console.log('Account result success:', accountResult.success);
      console.log('Campaigns result success:', campaignsResult.success);
      console.log('Ads result success:', adsResult.success);

      if (!accountResult.success) {
        return sendError(res, accountResult.error, 400);
      }

      // Build response with error tracking for partial failures
      const responseData = {
        account: this.normalizeAccount(accountResult.data),
        campaigns: campaignsResult.success ? campaignsResult.data : null,
        ads: adsResult.success ? adsResult.data : null,
        errors: {}
      };

      if (!campaignsResult.success) {
        responseData.errors.campaigns = campaignsResult.error;
        console.log('Campaigns error:', campaignsResult.error);
      }

      if (!adsResult.success) {
        responseData.errors.ads = adsResult.error;
        console.log('Ads error:', adsResult.error);
      }

      sendSuccess(res, responseData);
    }, req, res, 'Server error retrieving ads overview');
  }
}

// Create instance and export methods
const facebookAdsOverviewController = new FacebookAdsOverviewController();

export const getAdsOverview = facebookAdsOverviewController.getAdsOverview;