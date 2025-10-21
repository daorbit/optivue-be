import express from 'express';
import { getHome } from '../controllers/homeController.js';

const router = express.Router();

// Define routes
router.get('/', getHome);

export default router;