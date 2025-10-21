import express from 'express';
import { analyzeUrl } from '../controllers/seoController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/analyze', authMiddleware, analyzeUrl);

export default router;