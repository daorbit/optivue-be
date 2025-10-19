const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class SeoService {
  // Analyze SEO metrics for a given URL
  async analyzeUrl(url) {
    try {
      // Validate URL
      if (!url || !url.startsWith('http')) {
        throw new Error('Invalid URL provided');
      }

      const results = {
        url: url,
        meta: {},
        performance: {},
        technical: {},
        content: {}
      };

      // Get page content and meta tags
      const pageData = await this.getPageData(url);
      results.meta = pageData.meta;
      results.content = pageData.content;

      // Get performance metrics from Google PageSpeed Insights
      const performanceData = await this.getPageSpeedInsights(url);
      results.performance = performanceData;

      // Get technical SEO data
      results.technical = await this.getTechnicalSeoData(url);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('SEO analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get page content and meta tags
  async getPageData(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      const meta = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || '',
        twitterTitle: $('meta[name="twitter:title"]').attr('content') || '',
        twitterDescription: $('meta[name="twitter:description"]').attr('content') || '',
        twitterImage: $('meta[name="twitter:image"]').attr('content') || '',
        canonical: $('link[rel="canonical"]').attr('href') || '',
        robots: $('meta[name="robots"]').attr('content') || ''
      };

      const content = {
        h1Count: $('h1').length,
        h2Count: $('h2').length,
        h3Count: $('h3').length,
        imgCount: $('img').length,
        linkCount: $('a').length,
        wordCount: $('body').text().split(/\s+/).filter(word => word.length > 0).length,
        hasSchema: $('script[type="application/ld+json"]').length > 0
      };

      return { meta, content };
    } catch (error) {
      throw new Error(`Failed to fetch page data: ${error.message}`);
    }
  }

  // Get Google PageSpeed Insights data
  async getPageSpeedInsights(url) {
    try {
      const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
      if (!apiKey) {
        return {
          note: 'Google PageSpeed API key not configured',
          scores: {}
        };
      }

      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;

      const response = await axios.get(apiUrl, { timeout: 30000 });

      const data = response.data;
      const lighthouse = data.lighthouseResult;

      return {
        overallScore: lighthouse.categories.performance.score * 100,
        scores: {
          performance: lighthouse.categories.performance.score * 100,
          accessibility: lighthouse.categories.accessibility.score * 100,
          bestPractices: lighthouse.categories['best-practices'].score * 100,
          seo: lighthouse.categories.seo.score * 100
        },
        metrics: {
          firstContentfulPaint: this.extractMetric(lighthouse.audits['first-contentful-paint']),
          speedIndex: this.extractMetric(lighthouse.audits['speed-index']),
          largestContentfulPaint: this.extractMetric(lighthouse.audits['largest-contentful-paint']),
          interactive: this.extractMetric(lighthouse.audits['interactive']),
          totalBlockingTime: this.extractMetric(lighthouse.audits['total-blocking-time']),
          cumulativeLayoutShift: this.extractMetric(lighthouse.audits['cumulative-layout-shift'])
        }
      };
    } catch (error) {
      console.error('PageSpeed Insights error:', error);
      return {
        error: 'Failed to fetch PageSpeed data',
        scores: {}
      };
    }
  }

  // Extract metric value from Lighthouse audit
  extractMetric(audit) {
    if (!audit || !audit.numericValue) return null;
    return {
      value: audit.numericValue,
      unit: audit.numericUnit || '',
      displayValue: audit.displayValue || ''
    };
  }

  // Get technical SEO data
  async getTechnicalSeoData(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      return {
        statusCode: response.status,
        contentType: response.headers['content-type'] || '',
        contentLength: response.headers['content-length'] || '',
        server: response.headers['server'] || '',
        hasHttps: url.startsWith('https'),
        hasMobileViewport: $('meta[name="viewport"]').length > 0,
        hasFavicon: $('link[rel="icon"], link[rel="shortcut icon"]').length > 0,
        hasOpenGraph: $('meta[property^="og:"]').length > 0,
        hasTwitterCards: $('meta[name^="twitter:"]').length > 0,
        hasStructuredData: $('script[type="application/ld+json"]').length > 0,
        imageAltCount: $('img[alt]').length,
        totalImages: $('img').length,
        missingAltImages: $('img:not([alt])').length
      };
    } catch (error) {
      throw new Error(`Failed to get technical data: ${error.message}`);
    }
  }
}

module.exports = new SeoService();