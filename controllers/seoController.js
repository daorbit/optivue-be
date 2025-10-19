const seoService = require('../utils/seoService');

// Analyze SEO for a given URL
exports.analyzeUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    const result = await seoService.analyzeUrl(url);

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
    console.error('SEO analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during SEO analysis'
    });
  }
};