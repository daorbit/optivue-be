const FB = require('fb');

class FacebookAdsService {
  constructor() {
    // Initialize with app credentials if needed
    // FB.setAccessToken(process.env.FACEBOOK_APP_ACCESS_TOKEN);
  }

  /**
   * Get ad account information
   */
  async getAdAccount(accountId, accessToken) {
    try {
      FB.setAccessToken(accessToken);
      const response = await FB.api(`/${accountId}`, {
        fields: 'id,name,account_id,currency,timezone_name,account_status,spend_cap,balance'
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Ad Account):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ad account'
      };
    }
  }

  /**
   * Get campaigns for an ad account
   */
  async getCampaigns(accountId, accessToken, params = {}) {
    try {
      FB.setAccessToken(accessToken);
      const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time';
      const queryParams = {
        fields,
        limit: params.limit || 50,
        ...params
      };

      const response = await FB.api(`/${accountId}/campaigns`, queryParams);
      return {
        success: true,
        data: response.data,
        paging: response.paging
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Campaigns):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch campaigns'
      };
    }
  }

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(campaignId, accessToken, params = {}) {
    try {
      FB.setAccessToken(accessToken);
      const fields = 'id,name,status,daily_budget,lifetime_budget,targeting,created_time,updated_time,start_time,stop_time';
      const queryParams = {
        fields,
        limit: params.limit || 50,
        ...params
      };

      const response = await FB.api(`/${campaignId}/adsets`, queryParams);
      return {
        success: true,
        data: response.data,
        paging: response.paging
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Ad Sets):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ad sets'
      };
    }
  }

  /**
   * Get ads for an ad set
   */
  async getAds(adSetId, accessToken, params = {}) {
    try {
      FB.setAccessToken(accessToken);
      const fields = 'id,name,status,creative,created_time,updated_time,tracking_specs';
      const queryParams = {
        fields,
        limit: params.limit || 50,
        ...params
      };

      const response = await FB.api(`/${adSetId}/ads`, queryParams);
      return {
        success: true,
        data: response.data,
        paging: response.paging
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Ads):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ads'
      };
    }
  }

  /**
   * Get insights/stats for campaigns, ad sets, or ads
   */
  async getInsights(objectId, accessToken, level = 'campaign', params = {}) {
    try {
      FB.setAccessToken(accessToken);
      const fields = 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values';
      const queryParams = {
        fields,
        level,
        time_range: params.time_range || { since: '2024-01-01', until: new Date().toISOString().split('T')[0] },
        limit: params.limit || 100,
        ...params
      };

      const response = await FB.api(`/${objectId}/insights`, queryParams);
      return {
        success: true,
        data: response.data,
        paging: response.paging
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Insights):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch insights'
      };
    }
  }

  /**
   * Get account insights (high-level stats)
   */
  async getAccountInsights(accountId, accessToken, params = {}) {
    return this.getInsights(accountId, accessToken, 'account', params);
  }

  /**
   * Get campaign insights
   */
  async getCampaignInsights(campaignId, accessToken, params = {}) {
    return this.getInsights(campaignId, accessToken, 'campaign', params);
  }

  /**
   * Get ad set insights
   */
  async getAdSetInsights(adSetId, accessToken, params = {}) {
    return this.getInsights(adSetId, accessToken, 'adset', params);
  }

  /**
   * Get ad insights
   */
  async getAdInsights(adId, accessToken, params = {}) {
    return this.getInsights(adId, accessToken, 'ad', params);
  }
}

module.exports = new FacebookAdsService();