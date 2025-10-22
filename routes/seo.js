import express from 'express';
import { analyzeUrl, getAiSuggestions } from '../controllers/seoController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/analyze', authMiddleware, analyzeUrl);
router.post('/ai-suggestions', authMiddleware, getAiSuggestions);

export default router;