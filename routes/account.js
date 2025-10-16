const express = require('express');
const { body } = require('express-validator');
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation rules for update
const updateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('applications')
    .optional()
    .isArray()
    .withMessage('Applications must be an array'),
  body('applications.*.category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  body('applications.*.type')
    .optional()
    .isString()
    .withMessage('Type must be a string'),
  body('applications.*.label')
    .optional()
    .isString()
    .withMessage('Label must be a string'),
  body('applications.*.configuration')
    .optional()
    .isObject()
    .withMessage('Configuration must be an object')
];

// Routes
router.get('/account', authMiddleware, accountController.getAccount);
router.put('/account', authMiddleware, updateValidation, accountController.updateAccount);

module.exports = router;