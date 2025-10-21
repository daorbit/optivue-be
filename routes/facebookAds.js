import express from 'express';
import { 
  getAdAccount, 
  getCampaigns, 
  getInsights, 
  getAdsOverview, 
  getCampaignCreatives 
} from '../controllers/facebookAdsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All Facebook Ads routes require authentication
router.use(authMiddleware);

// Get ad account information
router.get('/facebook-ads/account', getAdAccount);

// Get campaigns
router.get('/facebook-ads/campaigns', getCampaigns);

// Get insights/stats
router.get('/facebook-ads/insights', getInsights);

// Get ads overview (account + insights combined)
router.get('/facebook-ads/overview', getAdsOverview);

// Get campaign creatives with media
router.get('/facebook-ads/campaigns/:campaignId/creatives', getCampaignCreatives);

export default router;