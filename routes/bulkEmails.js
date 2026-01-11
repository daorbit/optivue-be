import express from 'express';
import bulkEmailsController from '../controllers/bulkEmailsController.js';

const router = express.Router();

// Get email templates
router.get('/templates', bulkEmailsController.getEmailTemplates);

// Send bulk email
router.post('/send', bulkEmailsController.sendBulkEmail);

export default router;