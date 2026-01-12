import EmailService from '../utils/emailService.js';
import BaseController from './BaseController.js';

class BulkEmailsController extends BaseController {
  constructor() {
    super();
    this.bindMethods(['getEmailTemplates', 'sendBulkEmail']);
  }

  getTemplates() {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to Optivue - Your SEO & Marketing Dashboard',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Optivue</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Optivue!</h1>
        </div>
        <div class="content">
            <h2>Hello {{name}}!</h2>
            <p>Thank you for joining Optivue, your comprehensive SEO and marketing dashboard. We're excited to help you optimize your online presence and drive better results.</p>

            <h3>What you can do with Optivue:</h3>
            <ul>
                <li>Track your website's SEO performance</li>
                <li>Monitor social media analytics</li>
                <li>Manage Facebook Ads campaigns</li>
                <li>Get AI-powered insights and recommendations</li>
            </ul>

            <a href="{{login_url}}" class="button">Get Started</a>

            <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Optivue. All rights reserved.</p>
            <p>You're receiving this email because you signed up for Optivue.</p>
        </div>
    </div>
</body>
</html>`
      },
      {
        id: 'newsletter',
        name: 'Monthly Newsletter',
        subject: 'Optivue Monthly Update - {{month}} {{year}}',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Optivue Monthly Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .highlight { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Optivue Monthly Update</h1>
        </div>
        <div class="content">
            <h2>Hello {{name}}!</h2>
            <p>Here's your monthly update from Optivue. Let's dive into the key metrics and insights for {{month}} {{year}}.</p>

            <div class="highlight">
                <h3>SEO Performance</h3>
                <p>{{seo_summary}}</p>
            </div>

            <h3>Top Performing Pages</h3>
            <p>{{top_pages}}</p>

            <h3>Social Media Insights</h3>
            <p>{{social_insights}}</p>

            <h3>SEO Tip of the Month</h3>
            <p>{{seo_tip}}</p>

            <h3>Marketing Insights</h3>
            <p>{{marketing_insight}}</p>

            <a href="{{dashboard_url}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">View Dashboard</a>
        </div>
        <div class="footer">
            <p>&copy; 2024 Optivue. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Email Preferences</a></p>
        </div>
    </div>
</body>
</html>`
      },
      {
        id: 'promotion',
        name: 'Promotional Email',
        subject: 'Special Offer: {{offer_title}}',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Special Offer from Optivue</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .offer-box { border: 2px solid #dc2626; padding: 20px; margin: 20px 0; text-align: center; background-color: #fef2f2; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Limited Time Offer!</h1>
        </div>
        <div class="content">
            <h2>Hello {{name}}!</h2>

            <div class="offer-box">
                <h2>{{offer_title}}</h2>
                <p style="font-size: 24px; color: #dc2626; font-weight: bold;">{{discount}}</p>
                <p>{{offer_description}}</p>
                <p style="font-size: 12px; color: #666;">Valid until {{valid_until}}</p>
            </div>

            <p>Don't miss out on this limited-time offer! Upgrade your Optivue plan today and take your marketing to the next level.</p>

            <div style="text-align: center;">
                <a href="{{offer_url}}" class="button">Claim Offer Now</a>
            </div>

            <p>Questions? Reply to this email or contact our sales team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Optivue. All rights reserved.</p>
            <p>This promotional email was sent to {{email}}.</p>
        </div>
    </div>
</body>
</html>`
      }
    ];
  }

  // Get available email templates
  async getEmailTemplates(req, res) {
    try {
      const templates = this.getTemplates();
      res.json({
        success: true,
        templates: templates
      });
    } catch (error) {
      console.error('Error getting email templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email templates'
      });
    }
  }

  // Send bulk email
  async sendBulkEmail(req, res) {
    try {
      const { templateId, subject, recipients, customContent } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Recipients array is required and cannot be empty'
        });
      }

      if (!subject || !templateId) {
        return res.status(400).json({
          success: false,
          message: 'Subject and templateId are required'
        });
      }

      // Get template
      const templates = { templates: this.getTemplates() };
      const template = templates.templates.find(t => t.id === templateId);

      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Prepare email content
      let htmlContent = template.html;
      let emailSubject = subject;

      // Replace placeholders with custom content if provided
      if (customContent) {
        Object.keys(customContent).forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = customContent[key];
          htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
          emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      // Send emails
      const results = [];
      for (const recipient of recipients) {
        try {
          const personalizedHtml = htmlContent.replace(/{{name}}/g, recipient.name || 'Valued Customer')
                                            .replace(/{{email}}/g, recipient.email);

          const result = await EmailService.sendEmail({
            to: recipient.email,
            subject: emailSubject,
            html: personalizedHtml
          });

          results.push({
            email: recipient.email,
            status: 'sent',
            messageId: result.messageId
          });
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          results.push({
            email: recipient.email,
            status: 'failed',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk email sent to ${results.filter(r => r.status === 'sent').length} recipients`,
        results: results
      });
    } catch (error) {
      console.error('Error sending bulk email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk email',
        error: error.message
      });
    }
  }
}

export default new BulkEmailsController();
