const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const auth = require('../middleware/auth');

router.post('/analyze', auth, seoController.analyzeUrl);

module.exports = router;