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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        applications: user.applications,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
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

    const { username, applications } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided (email cannot be updated)
    if (username !== undefined) user.username = username;
    if (applications !== undefined) user.applications = applications;

    await user.save();

    res.json({
      success: true,
      message: 'Account updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        applications: user.applications,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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