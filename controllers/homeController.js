import BaseController from './BaseController.js';
import { sendSuccess } from '../utils/responseHelpers.js';

/**
 * Home Controller
 * Handles basic application information endpoints
 */
class HomeController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['getHome']);
  }

  /**
   * Get home/welcome message
   */
  async getHome(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      sendSuccess(res, {
        message: 'Welcome to Optivue Backend API',
        version: '1.0.0',
        endpoints: {
          auth: ['/auth/signup', '/auth/login', '/auth/profile'],
          account: ['/account', '/account/update'],
          seo: ['/seo/analyze'],
          facebookAds: ['/facebook-ads/account', '/facebook-ads/campaigns', '/facebook-ads/insights', '/facebook-ads/overview']
        }
      });
    }, req, res, 'Server error retrieving home information');
  }
}

// Create instance and export methods
const homeController = new HomeController();

export const getHome = homeController.getHome;