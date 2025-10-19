const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const auth = require('../middleware/auth');

// SEO analysis endpoint (requires authentication)
router.post('/analyze', auth, seoController.analyzeUrl);

module.exports = router;