import BaseController from './BaseController.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';
import seoService from '../utils/seoService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    this.bindMethods(['analyzeUrl', 'getAiSuggestions']);
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
      const { nocaching } = req.query; // Get nocaching query parameter

      if (!url) {
        return sendError(res, 'URL is required', 400);
      }

      // Normalize and validate URL
      const normalizedUrl = this.normalizeUrl(url);
      if (!normalizedUrl) {
        return sendError(res, 'Invalid URL format', 400);
      }

      // Check if caching should be bypassed
      const bypassCache = nocaching === 'true' || nocaching === '1';

      // Check server-side cache first (unless bypassing)
      if (!bypassCache) {
        const cachedResult = this.getCachedResult(url);
        if (cachedResult) {
          // Set cache headers for browser caching
          this.setCacheHeaders(res, url);
          return sendSuccess(res, cachedResult);
        }
      }

      // Set cache headers before processing (unless bypassing cache)
      if (!bypassCache) {
        this.setCacheHeaders(res, url);
      } else {
        // Set no-cache headers when bypassing cache
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }

      // Check if client has cached version (only if not bypassing cache)
      if (!bypassCache && this.shouldReturn304(req, res, url)) {
        return res.status(304).end();
      }

      // Use normalized URL for analysis
      const result = await seoService.analyzeUrl(normalizedUrl);

      if (!result.success) {
        return sendError(res, result.error, 400);
      }

      // Cache the successful result (unless bypassing cache)
      if (!bypassCache) {
        this.setCachedResult(url, result.data);
      }

      sendSuccess(res, result.data);
    }, req, res, 'Server error during SEO analysis');
  }

  /**
   * Get AI-powered suggestions for SEO issues
   */
  async getAiSuggestions(req, res) {
    await this.executeWithErrorHandling(async (req, res) => {
      const { issues } = req.body;

      if (!issues || !Array.isArray(issues) || issues.length === 0) {
        return sendError(res, 'Issues array is required', 400);
      }

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Prepare the prompt for Gemini
      const issuesText = issues.map((issue, index) => 
        `${index + 1}. ${issue.title}: ${issue.description} (Score: ${issue.score}/100, Category: ${issue.category})`
      ).join('\n');

      const prompt = `You are an expert SEO consultant. I have the following SEO issues from a website analysis:

${issuesText}

Please provide practical, actionable suggestions to fix these issues. For each issue, give:
1. A clear explanation of why this issue matters
2. Simple, step-by-step instructions to fix it (as bullet points)
3. Priority level (High/Medium/Low)
4. Expected impact on performance (High/Medium/Low)
5. Code examples or configuration snippets if applicable (provide actual code)

Format your response as a JSON array where each object has: issueIndex, title, explanation, steps (array of strings), priority, impact, codeExample (string, optional).

Respond only with valid JSON, no additional text.`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log('Gemini API raw response:', text);

         text = text.trim();
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

         let suggestions;
        try {
          suggestions = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text that failed to parse:', text);
          return sendError(res, 'AI returned invalid response format', 500);
        }

        sendSuccess(res, { suggestions });
      } catch (error) {
        console.error('Gemini API error:', error);
        return sendError(res, 'Failed to generate AI suggestions', 500);
      }
    }, req, res, 'Server error during AI suggestions generation');
  }
}

 const seoController = new SeoController();

export const analyzeUrl = seoController.analyzeUrl;
export const getAiSuggestions = seoController.getAiSuggestions;