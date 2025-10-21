import { getAdAccount } from './facebookAds/FacebookAdsAccountController.js';
import { getCampaigns, getCampaignCreatives } from './facebookAds/FacebookAdsCampaignsController.js';
import { getInsights } from './facebookAds/FacebookAdsInsightsController.js';
import { getAdsOverview } from './facebookAds/FacebookAdsOverviewController.js';

/**
 * Main Facebook Ads Controller
 * Aggregates all Facebook Ads related controllers
 */

export {
  // Account operations
  getAdAccount,
  
  // Campaign operations
  getCampaigns,
  getCampaignCreatives,
  
  // Insights operations
  getInsights,
  
  // Overview operations
  getAdsOverview
};