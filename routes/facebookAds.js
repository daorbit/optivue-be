const express = require('express');
const facebookAdsController = require('../controllers/facebookAdsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All Facebook Ads routes require authentication
router.use(authMiddleware);

// Get ad account information
router.get('/facebook-ads/account', facebookAdsController.getAdAccount);

// Get campaigns
router.get('/facebook-ads/campaigns', facebookAdsController.getCampaigns);

// Get insights/stats
router.get('/facebook-ads/insights', facebookAdsController.getInsights);

// Get ads overview (account + insights combined)
router.get('/facebook-ads/overview', facebookAdsController.getAdsOverview);

// Get campaign creatives with media
router.get('/facebook-ads/campaigns/:campaignId/creatives', facebookAdsController.getCampaignCreatives);

module.exports = router;