import BaseController from '../BaseController.js';
import { sendSuccess, sendError } from '../../utils/responseHelpers.js';
import { getUserAndApplication } from '../../utils/authHelpers.js';
import facebookAdsService from '../../utils/facebookAdsService.js';

/**
 * Facebook Ads Insights Controller
 * Handles Facebook Ads insights and analytics operations
 */
class FacebookAdsInsightsController extends BaseController {
  constructor() {
    super();
    this.applicationType = 'FACEBOOK_INSIGHTS';
    this.requiredFields = ['accountId', 'accessToken'];
    this.bindMethods(['getInsights']);
  }

  /**
   * Build time range parameters if provided
   * @param {Object} query - Request query parameters
   * @returns {Object} - Parameters object with time_range if applicable
   */
  buildInsightsParams(query) {
    const { level = 'account', since, until, ...otherParams } = query;
    const params = { ...otherParams };
    
    if (since && until) {
      params.time_range = { since, until };
    }
    
    return { level, params };
  }

  /**
   * Get insights based on level
   * @param {string} level - Insights level (account, campaign, adset, ad)
   * @param {string} accountId - Facebook account ID
   * @param {string} accessToken - Facebook access token
   * @param {Object} params - Additional parameters
   * @returns {Promise} - Service result
   */
  async getInsightsByLevel(level, accountId, accessToken, params) {
    switch (level) {
      case 'campaign':
        return await facebookAdsService.getCampaignInsights(accountId, accessToken, params);
      case 'adset':
        return await facebookAdsService.getAdSetInsights(accountId, accessToken, params);
      case 'ad':
        return await facebookAdsService.getAdInsights(accountId, accessToken, params);
      default:
        return await facebookAdsService.getAccountInsights(accountId, accessToken, params);
    }
  }

  /**
   * Get Facebook Ads insights/stats
   */
  async getInsights(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const result = await getUserAndApplication(
        req, res, 
        this.applicationType, 
        this.requiredFields
      );
      if (!result) return; // Error already sent

      const { accountId, accessToken } = result.application.configuration;
      const { level, params } = this.buildInsightsParams(req.query);

      const serviceResult = await this.getInsightsByLevel(level, accountId, accessToken, params);

      if (!serviceResult.success) {
        return sendError(res, serviceResult.error, 400);
      }

      sendSuccess(res, {
        data: serviceResult.data,
        paging: serviceResult.paging
      });
    }, req, res, 'Server error retrieving insights');
  }
}

// Create instance and export methods
const facebookAdsInsightsController = new FacebookAdsInsightsController();

export const getInsights = facebookAdsInsightsController.getInsights;