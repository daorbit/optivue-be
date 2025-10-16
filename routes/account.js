const express = require('express');
const { body } = require('express-validator');
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation rules for update
const updateValidation = [
  body('ga4_id')
    .optional()
    .isString()
    .withMessage('GA4 ID must be a string'),
  body('fb_access_token')
    .optional()
    .isString()
    .withMessage('Facebook access token must be a string'),
  body('fb_account_id')
    .optional()
    .isString()
    .withMessage('Facebook account ID must be a string')
];

// Routes
router.get('/account', authMiddleware, accountController.getAccount);
router.put('/account', authMiddleware, updateValidation, accountController.updateAccount);

module.exports = router;