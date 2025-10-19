const User = require('../models/User');
const facebookAdsService = require('../utils/facebookAdsService');

// Get Facebook Ads account info
exports.getAdAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find Facebook Insights application
    const facebookApp = user.applications.find(app =>
      app.type === 'FACEBOOK_INSIGHTS'
    );

    if (!facebookApp) {
      return res.status(400).json({
        success: false,
        message: 'Facebook Insights application not configured'
      });
    }

    const { accountId, accessToken } = facebookApp.configuration;

    if (!accountId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook account ID and access token are required'
      });
    }

    const result = await facebookAdsService.getAdAccount(accountId, accessToken);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get ad account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Facebook Ads campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const facebookApp = user.applications.find(app =>
      app.type === 'FACEBOOK_INSIGHTS'
    );

    if (!facebookApp) {
      return res.status(400).json({
        success: false,
        message: 'Facebook Insights application not configured'
      });
    }

    const { accountId, accessToken } = facebookApp.configuration;
    const params = req.query; // Allow query parameters like limit, status, etc.

    const result = await facebookAdsService.getCampaigns(accountId, accessToken, params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      paging: result.paging
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Facebook Ads insights/stats
exports.getInsights = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const facebookApp = user.applications.find(app =>
      app.type === 'FACEBOOK_INSIGHTS'
    );

    if (!facebookApp) {
      return res.status(400).json({
        success: false,
        message: 'Facebook Insights application not configured'
      });
    }

    const { accountId, accessToken } = facebookApp.configuration;
    const { level = 'account', since, until, ...otherParams } = req.query;

    const params = { ...otherParams };
    if (since && until) {
      params.time_range = { since, until };
    }

    let result;
    switch (level) {
      case 'campaign':
        result = await facebookAdsService.getCampaignInsights(accountId, accessToken, params);
        break;
      case 'adset':
        result = await facebookAdsService.getAdSetInsights(accountId, accessToken, params);
        break;
      case 'ad':
        result = await facebookAdsService.getAdInsights(accountId, accessToken, params);
        break;
      default:
        result = await facebookAdsService.getAccountInsights(accountId, accessToken, params);
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      paging: result.paging
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Facebook Ads overview (combined data)
exports.getAdsOverview = async (req, res) => {
  try {
    console.log('Getting ads overview for user:', req.user.userId);

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('User not found:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const facebookApp = user.applications.find(app =>
      app.type === 'FACEBOOK_INSIGHTS'
    );

    if (!facebookApp) {
      console.log('Facebook Insights application not configured for user:', req.user.userId);
      return res.status(400).json({
        success: false,
        message: 'Facebook Insights application not configured'
      });
    }

    const { accountId, accessToken } = facebookApp.configuration;
    console.log('Account ID:', accountId);
    console.log('Access token exists:', !!accessToken);

    if (!accountId || !accessToken) {
      console.log('Missing accountId or accessToken');
      return res.status(400).json({
        success: false,
        message: 'Facebook account ID and access token are required'
      });
    }

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
      return res.status(400).json({
        success: false,
        message: accountResult.error
      });
    }

    // For campaigns and ads, we'll include them even if they fail, but log the errors
    const normalizeAccount = (acct) => {
      if (!acct) return acct;
      const normalized = { ...acct };
      // ensure account.id and account.account_id have 'act_' prefix
      if (normalized.account_id && !String(normalized.account_id).startsWith('act_')) {
        normalized.account_id = `act_${normalized.account_id}`;
      }
      if (normalized.id && !String(normalized.id).startsWith('act_')) {
        normalized.id = String(normalized.id).startsWith('act_') ? normalized.id : `act_${normalized.id.replace(/^act_?/, '')}`;
      }
      return normalized;
    };

    const responseData = {
      account: normalizeAccount(accountResult.data),
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

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get ads overview error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get campaign creatives with media
exports.getCampaignCreatives = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const facebookApp = user.applications.find(app =>
      app.type === 'FACEBOOK_INSIGHTS'
    );

    if (!facebookApp) {
      return res.status(400).json({
        success: false,
        message: 'Facebook Insights application not configured'
      });
    }

    const { accountId, accessToken } = facebookApp.configuration;
    const { campaignId } = req.params;
    const params = req.query;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    const result = await facebookAdsService.getCampaignCreatives(campaignId, accessToken, params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      paging: result.paging
    });
  } catch (error) {
    console.error('Get campaign creatives error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};