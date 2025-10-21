import BaseController from '../BaseController.js';
import { sendSuccess, sendError } from '../../utils/responseHelpers.js';
import { getUserAndApplication } from '../../utils/authHelpers.js';
import facebookAdsService from '../../utils/facebookAdsService.js';

/**
 * Facebook Ads Campaigns Controller
 * Handles Facebook Ads campaigns related operations
 */
class FacebookAdsCampaignsController extends BaseController {
  constructor() {
    super();
    this.applicationType = 'FACEBOOK_INSIGHTS';
    this.requiredFields = ['accountId', 'accessToken'];
    this.bindMethods(['getCampaigns', 'getCampaignCreatives']);
  }

  /**
   * Get Facebook Ads campaigns
   */
  async getCampaigns(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const result = await getUserAndApplication(
        req, res, 
        this.applicationType, 
        this.requiredFields
      );
      if (!result) return; // Error already sent

      const { accountId, accessToken } = result.application.configuration;
      const params = req.query; // Allow query parameters like limit, status, etc.

      const serviceResult = await facebookAdsService.getCampaigns(accountId, accessToken, params);

      if (!serviceResult.success) {
        return sendError(res, serviceResult.error, 400);
      }

      sendSuccess(res, {
        data: serviceResult.data,
        paging: serviceResult.paging
      });
    }, req, res, 'Server error retrieving campaigns');
  }

  /**
   * Get campaign creatives with media
   */
  async getCampaignCreatives(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const result = await getUserAndApplication(
        req, res, 
        this.applicationType, 
        this.requiredFields
      );
      if (!result) return; // Error already sent

      const { accessToken } = result.application.configuration;
      const { campaignId } = req.params;
      const params = req.query;

      if (!campaignId) {
        return sendError(res, 'Campaign ID is required', 400);
      }

      const serviceResult = await facebookAdsService.getCampaignCreatives(campaignId, accessToken, params);

      if (!serviceResult.success) {
        return sendError(res, serviceResult.error, 400);
      }

      sendSuccess(res, {
        data: serviceResult.data,
        paging: serviceResult.paging
      });
    }, req, res, 'Server error retrieving campaign creatives');
  }
}

// Create instance and export methods
const facebookAdsCampaignsController = new FacebookAdsCampaignsController();

export const getCampaigns = facebookAdsCampaignsController.getCampaigns;
export const getCampaignCreatives = facebookAdsCampaignsController.getCampaignCreatives;