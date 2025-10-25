import axios from "axios";

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.fromEmail = process.env.BREVO_FROM_EMAIL || "daorbit2k25@gmail.com";
    this.fromName = process.env.BREVO_FROM_NAME || "Optivue";
    this.baseURL = "https://api.brevo.com/v3";
  }

  /**
   * Send OTP email
   * @param {string} toEmail - Recipient email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - API response
   */
  async sendOTPEmail(toEmail, otp) {
    console.log("Sending OTP email to:", toEmail);
    console.log("Using API key:", this.apiKey ? "Set" : "Not set");
    console.log("From email:", this.fromEmail);
    console.log("From name:", this.fromName);

    try {
      console.log("Sending OTP email to:", toEmail);
      console.log("Using API key:", this.apiKey ? "Set" : "Not set");

      const response = await axios.post(
        `${this.baseURL}/smtp/email`,
        {
          sender: {
            name: this.fromName,
            email: this.fromEmail,
          },
          to: [
            {
              email: toEmail,
              name: toEmail.split("@")[0], // Optional recipient name
            },
          ],
          subject: "Your OTP for Optivue Account Verification",
          htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Optivue!</h2>
            <p>Please verify your email address by entering the following OTP code:</p>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message from Optivue. Please do not reply to this email.</p>
          </div>
        `,
        },
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error sending OTP email:",
        error.response?.data || error.message
      );
      throw new Error("Failed to send OTP email");
    }
  }

  /**
   * Send reset password email
   * @param {string} toEmail - Recipient email
   * @param {string} resetToken - Reset token
   * @returns {Promise<Object>} - API response
   */
  async sendResetPasswordEmail(toEmail, resetToken) {
    console.log("Sending reset password email to:", toEmail);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      const response = await axios.post(
        `${this.baseURL}/smtp/email`,
        {
          sender: {
            name: this.fromName,
            email: this.fromEmail,
          },
          to: [
            {
              email: toEmail,
              name: toEmail.split("@")[0],
            },
          ],
          subject: "Reset Your Optivue Password",
          htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested a password reset for your Optivue account.</p>
            <p>Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; cursor: pointer;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message from Optivue. Please do not reply to this email.</p>
          </div>
        `,
        },
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error sending reset password email:",
        error.response?.data || error.message
      );
      throw new Error("Failed to send reset password email");
    }
  }

  /**
   * Generate a 6-digit OTP
   * @returns {string} - 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default new EmailService();
