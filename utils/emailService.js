import axios from "axios";

class EmailService {
  constructor() {
    this.apiKey =
      "REDACTED_API_KEY";
    this.fromEmail = "daorbit2k25@gmail.com";
    this.fromName = "Optivue";
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
   * Generate a 6-digit OTP
   * @returns {string} - 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default new EmailService();
