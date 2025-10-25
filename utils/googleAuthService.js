import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class GoogleAuthService {
  constructor() {
    this.tokenUrl = 'https://oauth2.googleapis.com/token';
    this.userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  }

  get clientId() {
    return process.env.GOOGLE_CLIENT_ID;
  }

  get clientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET;
  }

  get redirectUri() {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  getAuthUrl() {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('Google OAuth is not properly configured. Check environment variables.');
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getAccessToken(code) {
    try {
      const params = new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      });

      const response = await axios.post(this.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to get access token from Google');
    }
  }

  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error.response?.data || error.message);
      throw new Error('Failed to get user info from Google');
    }
  }

  async authenticateWithCode(code) {
    const tokenData = await this.getAccessToken(code);
    const userInfo = await this.getUserInfo(tokenData.access_token);
    return userInfo;
  }
}

export default new GoogleAuthService();
