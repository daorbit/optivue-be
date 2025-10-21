import BaseController from './BaseController.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';
import seoService from '../utils/seoService.js';

// In-memory cache for SEO results
const seoCache = new Map();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

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
   * Get cached SEO result
   * @param {string} url - URL to check cache for
   * @returns {Object|null} - Cached result or null
   */
  getCachedResult(url) {
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) return null;

    const cacheKey = this.generateCacheKey(normalizedUrl);
    const cached = seoCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      seoCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Set cached SEO result
   * @param {string} url - URL to cache result for
   * @param {Object} data - SEO analysis data
   */
  setCachedResult(url, data) {
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) return;

    const cacheKey = this.generateCacheKey(normalizedUrl);
    seoCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Validate and normalize URL format
   * @param {string} url - URL to validate
   * @returns {string|null} - Normalized URL if valid, null if invalid
   */
  normalizeUrl(url) {
    try {
      // If URL doesn't start with protocol, add https://
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      
      // Validate the URL
      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidUrl(url) {
    return this.normalizeUrl(url) !== null;
  }

  /**
   * Generate cache key for URL analysis
   * @param {string} url - URL to analyze
   * @returns {string} - Cache key
   */
  generateCacheKey(url) {
    // Create a simple hash-like key from the URL
    return Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Set caching headers for browser caching
   * @param {Object} res - Express response object
   * @param {string} url - URL being analyzed
   */
  setCacheHeaders(res, url) {
    const cacheKey = this.generateCacheKey(url);
    const maxAge = 2 * 60 * 60; // 2 hours in seconds
    
    // Create a fixed timestamp based on the URL to ensure consistency
    const fixedTimestamp = new Date('2025-01-01T00:00:00.000Z').toUTCString();
    
    // Set cache headers
    res.set({
      'Cache-Control': `public, max-age=${maxAge}, must-revalidate`,
      'ETag': `"${cacheKey}"`,
      'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
      'Last-Modified': fixedTimestamp,
      'Vary': 'Accept-Encoding'
    });
  }

  /**
   * Check if request should return 304 Not Modified
   * @param {Object} req - Express request object
   * @param {string} url - URL being analyzed
   * @returns {boolean} - Whether to return 304
   */
  shouldReturn304(req, res, url) {
    const cacheKey = this.generateCacheKey(url);
    const clientETag = req.get('If-None-Match');
    const ifModifiedSince = req.get('If-Modified-Since');
    
    // Check ETag
    if (clientETag && clientETag === `"${cacheKey}"`) {
      return true;
    }
    
    return false;
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

      // Normalize and validate URL
      const normalizedUrl = this.normalizeUrl(url);
      if (!normalizedUrl) {
        return sendError(res, 'Invalid URL format', 400);
      }

      // Check server-side cache first
      const cachedResult = this.getCachedResult(url);
      if (cachedResult) {
        // Set cache headers for browser caching
        this.setCacheHeaders(res, url);
        return sendSuccess(res, cachedResult);
      }

      // Set cache headers before processing
      this.setCacheHeaders(res, url);

      // Check if client has cached version (keeping for future GET requests)
      if (this.shouldReturn304(req, res, url)) {
        return res.status(304).end();
      }

      // Use normalized URL for analysis
      const result = await seoService.analyzeUrl(normalizedUrl);

      if (!result.success) {
        return sendError(res, result.error, 400);
      }

      // Cache the successful result
      this.setCachedResult(url, result.data);

      sendSuccess(res, result.data);
    }, req, res, 'Server error during SEO analysis');
  }
}

// Create instance and export methods
const seoController = new SeoController();

export const analyzeUrl = seoController.analyzeUrl;