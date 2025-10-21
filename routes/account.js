import express from 'express';
import { body } from 'express-validator';
import { getAccount, updateAccount } from '../controllers/accountController.js';
import authMiddleware from '../middleware/auth.js';

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
router.get('/account', authMiddleware, getAccount);
router.put('/account', authMiddleware, updateValidation, updateAccount);

export default router;