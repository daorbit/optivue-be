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
   * Get campaigns with insights for an ad account
   */
  async getCampaignsWithInsights(accountId, accessToken, params = {}) {
    try {
      FB.setAccessToken(accessToken);
      const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,insights.fields(impressions,spend,reach,clicks,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values,cost_per_action_type,website_ctr,website_clicks,placement_with_impression_share)';
      const queryParams = {
        fields,
        limit: params.limit || 50,
        ...params
      };

      // Add time_range if provided
      if (params.since && params.until) {
        queryParams.time_range = { since: params.since, until: params.until };
      }

      const response = await FB.api(`/${accountId}/campaigns`, queryParams);

      // Process campaigns to determine platform (Facebook/Instagram/Mixed)
      const processedCampaigns = response.data.map(campaign => {
        let platform = 'facebook'; // default

        // Check if campaign has Instagram-specific insights or targeting
        if (campaign.insights && campaign.insights.data) {
          const hasInstagramPlacement = campaign.insights.data.some(insight =>
            insight.placement_with_impression_share &&
            (insight.placement_with_impression_share.includes('instagram') ||
             insight.placement_with_impression_share.includes('Instagram'))
          );
          if (hasInstagramPlacement) {
            platform = 'instagram';
          }
        }

        return {
          ...campaign,
          platform
        };
      });

      return {
        success: true,
        data: processedCampaigns,
        paging: response.paging
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Campaigns with Insights):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch campaigns with insights'
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
        time_range: params.since && params.until ? { since: params.since, until: params.until } : { since: '2024-01-01', until: new Date().toISOString().split('T')[0] },
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

  /**
   * Get comprehensive ads data with creatives and insights
   */
  async getAdsWithCreatives(accountId, accessToken, params = {}) {
    try {
      FB.setAccessToken(accessToken);
      const fields = 'id,name,status,adset_id,campaign_id,date_start,date_stop,creative{id,name,effective_object_story_id,object_story_spec,thumbnail_url,image_url,video_id,object_type,title,body,link_url,call_to_action},insights.fields(impressions,spend,reach,clicks,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values,placement_with_impression_share),tracking_specs,targeting';
      const queryParams = {
        fields,
        limit: params.limit || 50,
        filtering: params.filtering || [{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'ARCHIVED'] }],
        ...params
      };

      // Add time_range if provided
      if (params.since && params.until) {
        queryParams.time_range = { since: params.since, until: params.until };
      }

      const response = await FB.api(`/${accountId}/ads`, queryParams);

      // Process the response to include additional creative details
      const processedAds = await Promise.all(response.data.map(async (ad) => {
        let enhancedCreative = ad.creative;

        // If there's a video_id, get video details
        if (ad.creative && ad.creative.video_id) {
          try {
            const videoResponse = await FB.api(`/${ad.creative.video_id}`, {
              fields: 'id,title,description,source,thumbnails,picture,permalink_url,length,created_time'
            });
            enhancedCreative = {
              ...enhancedCreative,
              video_details: videoResponse
            };
          } catch (videoError) {
            console.warn(`Failed to fetch video details for ad ${ad.id}:`, videoError.message);
          }
        }

        // If there's an image_url, get image details
        if (ad.creative && ad.creative.image_url) {
          try {
            // Extract image hash from URL if needed
            const imageHash = ad.creative.image_url.split('/').pop()?.split('.')[0];
            if (imageHash) {
              const imageResponse = await FB.api(`/${imageHash}`, {
                fields: 'id,name,permalink_url,width,height,created_time'
              });
              enhancedCreative = {
                ...enhancedCreative,
                image_details: imageResponse
              };
            }
          } catch (imageError) {
            console.warn(`Failed to fetch image details for ad ${ad.id}:`, imageError.message);
          }
        }

        // Determine platform (Facebook vs Instagram) based on multiple factors
        let platform = 'facebook'; // default

        // Check creative targeting
        if (ad.creative?.object_story_spec?.instagram_actor_id) {
          platform = 'instagram';
        } else if (ad.creative?.object_story_spec?.page_id) {
          platform = 'facebook';
        }

        // Check insights placement data
        if (ad.insights && ad.insights.data) {
          const hasInstagramPlacement = ad.insights.data.some(insight =>
            insight.placement_with_impression_share &&
            (insight.placement_with_impression_share.includes('instagram') ||
             insight.placement_with_impression_share.includes('Instagram'))
          );
          if (hasInstagramPlacement) {
            platform = 'instagram';
          }
        }

        // Check targeting for Instagram-specific targeting
        if (ad.targeting && ad.targeting.publisher_platforms) {
          if (ad.targeting.publisher_platforms.includes('instagram')) {
            platform = platform === 'facebook' ? 'mixed' : 'instagram';
          }
        }

        return {
          ...ad,
          platform,
          creative: enhancedCreative
        };
      }));

      return {
        success: true,
        data: processedAds,
        paging: response.paging
      };
    } catch (error) {
      console.error('Facebook Ads API Error (Ads with Creatives):', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ads with creatives'
      };
    }
  }
}

module.exports = new FacebookAdsService();