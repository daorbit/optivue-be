const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get account info
exports.getAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update account info
exports.updateAccount = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { ga4_id, fb_access_token, fb_account_id } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (ga4_id !== undefined) user.ga4_id = ga4_id;
    if (fb_access_token !== undefined) user.fb_access_token = fb_access_token;
    if (fb_account_id !== undefined) user.fb_account_id = fb_account_id;

    await user.save();

    res.json({
      success: true,
      message: 'Account updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ga4_id: user.ga4_id,
        fb_access_token: user.fb_access_token,
        fb_account_id: user.fb_account_id
      }
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};