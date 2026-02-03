const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisePool } = require('../../config/database');
const { generateTokens } = require('../../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../services/email.service');

/**
 * Register a new user for mobile app
 * POST /api/v1/mobile-app/auth/register
 */
const register = async (req, res) => {
  try {
    const { full_name, email, password, language = 'en' } = req.body;

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const [existingUsers] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate email verification token
    // Use "1234" in development mode for easy testing
    const verification_token = process.env.NODE_ENV === 'development'
      ? '1234'
      : crypto.randomBytes(32).toString('hex');
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user (not verified yet, no subscription)
    const [result] = await promisePool.query(
      `INSERT INTO users (email, password_hash, full_name, language_preference, is_verified, verification_token, verification_expires)
       VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
      [email, password_hash, full_name, language, verification_token, verification_expires]
    );

    const userId = result.insertId;

    // Send verification email (only if SMTP is configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        console.log(`📧 SMTP configured. Attempting to send verification email to ${email}...`);
        await sendVerificationEmail(email, full_name, verification_token);
        console.log(`✅ Verification email sent to ${email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError.message);
        // Continue with registration even if email fails
      }
    } else {
      console.log('ℹ️ SMTP not configured (check .env). Skipping email sending.');
      console.log(`📧 Development Mode - Verification code for ${email}: ${verification_token}`);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user: {
          id: userId,
          email,
          full_name,
          is_verified: false
        },
        verification_sent: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
      }
    });
  } catch (error) {
    console.error('Mobile register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * Verify email
 * POST /api/v1/mobile-app/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification token are required'
      });
    }

    // Find user with matching email and token
    const [users] = await promisePool.query(
      `SELECT id, email, verification_expires FROM users
       WHERE email = ? AND verification_token = ? AND is_verified = FALSE`,
      [email, token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = users[0];

    // Check if token is expired
    if (new Date() > new Date(user.verification_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

    // Update user as verified
    await promisePool.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          is_verified: true
        }
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

/**
 * Resend verification email
 * POST /api/v1/mobile-app/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const [users] = await promisePool.query(
      'SELECT id, is_verified, full_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    // Use "1234" in development mode for easy testing
    const verification_token = process.env.NODE_ENV === 'development'
      ? '1234'
      : crypto.randomBytes(32).toString('hex');
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user
    await promisePool.query(
      'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
      [verification_token, verification_expires, user.id]
    );

    // Send verification email (only if SMTP is configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        console.log(`📧 SMTP configured. Attempting to resend verification email to ${email}...`);
        await sendVerificationEmail(email, user.full_name || 'User', verification_token);
        console.log(`✅ Verification email resent to ${email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to resend verification email:', emailError.message);
        // Return error if email fails on resend
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again later.'
        });
      }
    } else {
      console.log('ℹ️ SMTP not configured (check .env). Skipping email sending.');
      console.log(`📧 Development Mode - New verification code for ${email}: ${verification_token}`);
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification email',
      error: error.message
    });
  }
};

/**
 * Login user for mobile app
 * POST /api/v1/mobile-app/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Get user
    const [users] = await promisePool.query(
      `SELECT id, email, username, avatar, password_hash, full_name, role, is_active, is_verified, language_preference,
              subscription_plan_id, subscription_start_date, subscription_end_date, last_username_change, referral_code
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        error_code: 'EMAIL_NOT_VERIFIED',
        data: {
          email: user.email,
          requires_verification: true
        }
      });
    }

    // Check if user has subscription
    const [subscriptions] = await promisePool.query(
      `SELECT id FROM user_subscriptions
       WHERE user_id = ? AND status = 'active' AND end_date > NOW()
       LIMIT 1`,
      [user.id]
    );

    const hasSubscription = subscriptions.length > 0;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await promisePool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    // If no active subscription, allow login but flag that subscription is needed
    if (!hasSubscription) {
      console.log(`⚠️ User ${user.email} logged in without active subscription`);
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            full_name: user.full_name,
            role: user.role,
            language_preference: user.language_preference,
            is_verified: user.is_verified,
            has_active_subscription: false,
            requires_subscription: true,
            subscription_plan_id: user.subscription_plan_id,
            subscription_start_date: user.subscription_start_date,
            subscription_end_date: user.subscription_end_date,
            last_username_change: user.last_username_change,
            referral_code: user.referral_code
          },
          ...tokens,
          requires_subscription: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          full_name: user.full_name,
          role: user.role,
          language_preference: user.language_preference,
          is_verified: user.is_verified,
          has_active_subscription: hasSubscription,
          requires_subscription: !hasSubscription,
          subscription_plan_id: user.subscription_plan_id,
          subscription_start_date: user.subscription_start_date,
          subscription_end_date: user.subscription_end_date,
          last_username_change: user.last_username_change,
          referral_code: user.referral_code
        },
        ...tokens,
        requires_subscription: !hasSubscription
      }
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Request password reset
 * POST /api/v1/mobile-app/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user
    const [users] = await promisePool.query(
      'SELECT id, email, full_name, is_active FROM users WHERE email = ?',
      [email]
    );

    // Don't reveal if user exists or not (security best practice)
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database (add columns if needed)
    // For now, we'll use verification_token and verification_expires
    await promisePool.query(
      `UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?`,
      [resetToken, resetExpires, user.id]
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, user.full_name, resetToken);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send password reset email:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

/**
 * Reset password with token
 * POST /api/v1/mobile-app/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, token, new_password } = req.body;

    // Validate input
    if (!email || !token || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Email, token, and new password are required'
      });
    }

    // Validate password strength
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find user with matching email and reset token
    const [users] = await promisePool.query(
      `SELECT id, email, verification_expires FROM users
       WHERE email = ? AND verification_token = ? AND is_active = TRUE`,
      [email, token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = users[0];

    // Check if token is expired
    if (new Date() > new Date(user.verification_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password and clear reset token
    await promisePool.query(
      `UPDATE users SET password_hash = ?, verification_token = NULL, verification_expires = NULL WHERE id = ?`,
      [password_hash, user.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

/**
 * Change password (for authenticated users)
 * POST /api/v1/mobile-app/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user's current password hash
    const [users] = await promisePool.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password
    await promisePool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [password_hash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  changePassword
};