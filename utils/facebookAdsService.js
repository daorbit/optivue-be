import FB from 'fb';

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
      // Ensure account ID has the 'act_' prefix
      const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
      const response = await FB.api(`/${formattedAccountId}`, {
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
      // Ensure account ID has the 'act_' prefix
      const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
      const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,insights.fields(impressions,spend,reach,clicks,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values,cost_per_action_type,date_start,date_stop)';
      const queryParams = {
        fields,
        limit: params.limit || 50,
        ...params
      };

      // Add time_range if provided
      if (params.since && params.until) {
        queryParams.time_range = { since: params.since, until: params.until };
      }

      const response = await FB.api(`/${formattedAccountId}/campaigns`, queryParams);

      // Process campaigns to determine platform (Facebook/Instagram/Mixed)
      const processedCampaigns = response.data.map(campaign => {
        let platform = 'facebook'; // default

        // Check if campaign has Instagram-specific insights or targeting
        if (campaign.insights && campaign.insights.data) {
          // For now, we'll determine platform based on other factors
          // Since placement_with_impression_share is not available, we'll use a simpler approach
          platform = 'facebook'; // Default to facebook for now
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
      // Ensure account ID has the 'act_' prefix
      const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
      const fields = 'id,name,status,adset_id,campaign_id,date_start,date_stop,creative{id,name,effective_object_story_id,object_story_spec,thumbnail_url,image_url,video_id,object_type,title,body,link_url,call_to_action},insights.fields(impressions,spend,reach,clicks,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values),tracking_specs,targeting';
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

      const response = await FB.api(`/${formattedAccountId}/ads`, queryParams);

      // Process the response to include additional creative details
      const processedAds = await Promise.all(response.data.map(async (ad) => {
        let enhancedCreative = { ...ad.creative };
        let mediaUrls = [];

        try {
          // Extract media URLs from object_story_spec
          if (ad.creative?.object_story_spec) {
            const spec = ad.creative.object_story_spec;

            // Handle different creative types
            if (spec.image_data && spec.image_data.url) {
              // Single image creative
              mediaUrls.push({
                type: 'image',
                url: spec.image_data.url,
                thumbnail: spec.image_data.url // Use same URL for thumbnail
              });
            } else if (spec.link_data && spec.link_data.picture) {
              // Link creative with image
              mediaUrls.push({
                type: 'image',
                url: spec.link_data.picture,
                thumbnail: spec.link_data.picture
              });
            } else if (spec.video_data) {
              // Video creative
              if (spec.video_data.video_id) {
                try {
                  // Get video details for full URL
                  const videoResponse = await FB.api(`/${spec.video_data.video_id}`, {
                    fields: 'source,thumbnails,picture'
                  });

                  // Choose the largest thumbnail available
                  let bestThumbnail = videoResponse.picture;
                  if (videoResponse.thumbnails?.data && videoResponse.thumbnails.data.length > 0) {
                    // Sort thumbnails by width descending and pick the largest
                    const sortedThumbs = videoResponse.thumbnails.data.sort((a, b) => (b.width || 0) - (a.width || 0));
                    bestThumbnail = sortedThumbs[0].uri;
                  }

                  mediaUrls.push({
                    type: 'video',
                    url: videoResponse.source || spec.video_data.url,
                    thumbnail: bestThumbnail || spec.video_data.thumbnail
                  });
                } catch (videoError) {
                  console.warn(`Failed to fetch video details for ad ${ad.id}:`, videoError.message);
                  // Fallback to video_data URL
                  mediaUrls.push({
                    type: 'video',
                    url: spec.video_data.url,
                    thumbnail: spec.video_data.thumbnail
                  });
                }
              }
            } else if (spec.photo_data && spec.photo_data.url) {
              // Photo data
              mediaUrls.push({
                type: 'image',
                url: spec.photo_data.url,
                thumbnail: spec.photo_data.url
              });
            }
          }

          // Fallback to legacy fields if object_story_spec doesn't have media
          if (mediaUrls.length === 0) {
            if (ad.creative?.image_url) {
              mediaUrls.push({
                type: 'image',
                url: ad.creative.image_url,
                thumbnail: ad.creative.thumbnail_url || ad.creative.image_url
              });
            } else if (ad.creative?.video_id) {
              try {
                const videoResponse = await FB.api(`/${ad.creative.video_id}`, {
                  fields: 'source,thumbnails,picture'
                });
                mediaUrls.push({
                  type: 'video',
                  url: videoResponse.source,
                  thumbnail: videoResponse.thumbnails?.data?.[0]?.uri || videoResponse.picture
                });
              } catch (videoError) {
                console.warn(`Failed to fetch video details for ad ${ad.id}:`, videoError.message);
              }
            }
          }

          enhancedCreative = {
            ...enhancedCreative,
            media_urls: mediaUrls
          };
        } catch (creativeError) {
          console.warn(`Failed to process creative for ad ${ad.id}:`, creativeError.message);
        }

        // Determine platform (Facebook vs Instagram) based on multiple factors
        let platform = 'facebook'; // default

        // Check creative targeting
        if (ad.creative?.object_story_spec?.instagram_actor_id) {
          platform = 'instagram';
        } else if (ad.creative?.object_story_spec?.page_id) {
          platform = 'facebook';
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

export default new FacebookAdsService();