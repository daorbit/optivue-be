import express from 'express';
import { body } from 'express-validator';
import { signup, login, getProfile, verifyOtp, getOtp, googleAuth, googleCallback } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const verifyOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

const googleCallbackValidation = [
  body('code')
    .notEmpty()
    .withMessage('Authorization code is required')
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/verify-otp', verifyOtpValidation, verifyOtp);
router.post('/get-otp', getOtp); // Development only
router.get('/profile', authMiddleware, getProfile);

router.get('/google', googleAuth);
router.post('/google/callback', googleCallbackValidation, googleCallback);

export default router;