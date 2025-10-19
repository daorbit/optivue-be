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

    // Get account info and insights in parallel
    console.log('Making API calls to Facebook...');
    const [accountResult, insightsResult] = await Promise.all([
      facebookAdsService.getAdAccount(accountId, accessToken),
      facebookAdsService.getAccountInsights(accountId, accessToken, req.query)
    ]);

    console.log('Account result:', accountResult);
    console.log('Insights result:', insightsResult);

    if (!accountResult.success || !insightsResult.success) {
      return res.status(400).json({
        success: false,
        message: accountResult.error || insightsResult.error
      });
    }

    res.json({
      success: true,
      data: {
        account: accountResult.data,
        insights: insightsResult.data
      }
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