import BaseController from './BaseController.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';
import seoService from '../utils/seoService.js';

/**
 * SEO Controller
 * Handles SEO analysis operations
 */
class SeoController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['analyzeUrl']);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze URL for SEO metrics
   */
  async analyzeUrl(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { url } = req.body;

      if (!url) {
        return sendError(res, 'URL is required', 400);
      }

      if (!this.isValidUrl(url)) {
        return sendError(res, 'Invalid URL format', 400);
      }

      const result = await seoService.analyzeUrl(url);

      if (!result.success) {
        return sendError(res, result.error, 400);
      }

      sendSuccess(res, result.data);
    }, req, res, 'Server error during SEO analysis');
  }
}

// Create instance and export methods
const seoController = new SeoController();

export const analyzeUrl = seoController.analyzeUrl;