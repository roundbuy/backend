const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisePool } = require('../../config/database');
const { generateTokens } = require('../../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../services/email.service');
const appleSignin = require('apple-signin-auth');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Register a new user for mobile app
 * POST /api/v1/mobile-app/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      full_name, email, password, language = 'en',
      username, account_type, company_name, vat_number, business_address,
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const [existingUsers] = await promisePool.query(
      'SELECT id FROM users WHERE email = ? OR (username IS NOT NULL AND username = ?)',
      [email, username || null]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email or username already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const verification_token = process.env.NODE_ENV === 'development'
      ? '1234'
      : crypto.randomBytes(32).toString('hex');
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user_type = account_type === 'business' ? 'business' : 'private';

    const [result] = await promisePool.query(
      `INSERT INTO users
         (email, username, password_hash, full_name, language_preference,
          user_type, company_name, vat_number, business_address,
          is_verified, verification_token, verification_expires)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?)`,
      [
        email, username || null, password_hash, full_name, language,
        user_type, company_name || null, vat_number || null, business_address || null,
        verification_token, verification_expires,
      ]
    );

    const userId = result.insertId;

    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        await sendVerificationEmail(email, full_name, verification_token);
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError.message);
      }
    } else {
      console.log(`📧 Dev verification code for ${email}: ${verification_token}`);
    }

    // Issue tokens immediately so business users can upload KYB docs before email verification
    const { access_token, refresh_token } = generateTokens(userId, 'subscriber');

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for a verification code.',
      data: {
        user: {
          id: userId,
          email,
          username: username || null,
          full_name,
          user_type,
          company_name: company_name || null,
          is_verified: false,
          role: 'subscriber',
        },
        access_token,
        refresh_token,
        verification_sent: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
      },
    });
  } catch (error) {
    console.error('Mobile register error:', error);
    res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
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

    // Get user with subscription plan details (like login)
    const [updatedUsers] = await promisePool.query(
      `SELECT u.id, u.email, u.username, u.avatar, u.password_hash, u.full_name, u.role, u.is_active, u.is_verified, u.language_preference,
              u.user_type, u.subscription_plan_id, u.subscription_start_date, u.subscription_end_date, u.last_username_change, u.referral_code,
              u.kyc_status, u.kyc_completed, u.kyc_required,
              sp.slug as subscription_plan_slug, sp.name as subscription_plan_name
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
      [user.id]
    );

    const updatedUser = updatedUsers[0];

    // Check if user has subscription
    const [subscriptions] = await promisePool.query(
      `SELECT id FROM user_subscriptions
       WHERE user_id = ? AND status = 'active' AND end_date > NOW()
       LIMIT 1`,
      [user.id]
    );

    const hasSubscription = subscriptions.length > 0;

    // Generate tokens for auto-login
    const tokens = generateTokens(updatedUser.id, updatedUser.role);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          user_type: updatedUser.user_type,
          language_preference: updatedUser.language_preference,
          is_verified: updatedUser.is_verified,
          has_active_subscription: hasSubscription,
          requires_subscription: !hasSubscription,
          subscription_plan_id: updatedUser.subscription_plan_id,
          subscription_plan_slug: updatedUser.subscription_plan_slug,
          subscription_plan_name: updatedUser.subscription_plan_name,
          subscription_start_date: updatedUser.subscription_start_date,
          subscription_end_date: updatedUser.subscription_end_date,
          last_username_change: updatedUser.last_username_change,
          referral_code: updatedUser.referral_code,
          kyc_status: updatedUser.kyc_status,
          kyc_completed: updatedUser.kyc_completed,
          kyc_required: updatedUser.kyc_required
        },
        ...tokens
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

    // Get user with subscription plan details
    const [users] = await promisePool.query(
      `SELECT u.id, u.email, u.username, u.avatar, u.password_hash, u.full_name, u.role, u.is_active, u.is_verified, u.language_preference,
              u.user_type, u.subscription_plan_id, u.subscription_start_date, u.subscription_end_date, u.last_username_change, u.referral_code,
              u.kyc_status, u.kyc_completed, u.kyc_required,
              sp.slug as subscription_plan_slug, sp.name as subscription_plan_name
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.email = ?`,
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

    // Verify password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check subscription
    const [subscriptions] = await promisePool.query(
      `SELECT id FROM user_subscriptions
       WHERE user_id = ? AND status = 'active' AND end_date > NOW()
       LIMIT 1`,
      [user.id]
    );
    const hasSubscription = subscriptions.length > 0;

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
            user_type: user.user_type,
            language_preference: user.language_preference,
            is_verified: user.is_verified,
            has_active_subscription: false,
            requires_subscription: true,
            subscription_plan_id: user.subscription_plan_id,
            subscription_plan_slug: user.subscription_plan_slug,
            subscription_plan_name: user.subscription_plan_name,
            subscription_start_date: user.subscription_start_date,
            subscription_end_date: user.subscription_end_date,
            last_username_change: user.last_username_change,
            referral_code: user.referral_code,
            kyc_status: user.kyc_status,
            kyc_completed: user.kyc_completed,
            kyc_required: user.kyc_required
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
          user_type: user.user_type,
          language_preference: user.language_preference,
          is_verified: user.is_verified,
          has_active_subscription: hasSubscription,
          requires_subscription: !hasSubscription,
          subscription_plan_id: user.subscription_plan_id,
          subscription_plan_slug: user.subscription_plan_slug,
          subscription_plan_name: user.subscription_plan_name,
          subscription_start_date: user.subscription_start_date,
          subscription_end_date: user.subscription_end_date,
          last_username_change: user.last_username_change,
          referral_code: user.referral_code,
          kyc_status: user.kyc_status,
          kyc_completed: user.kyc_completed,
          kyc_required: user.kyc_required
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

/**
 * Sign in with Apple for mobile app
 * POST /api/v1/mobile-app/auth/apple-login
 */
const appleLogin = async (req, res) => {
  try {
    const { identity_token, id_token, full_name, email: providedEmail, user: userData } = req.body;
    const token = identity_token || id_token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Identity token is required'
      });
    }

    // Verify the token with Apple
    // Note: In development/testing, we might skip full verification if Apple setup is incomplete
    let appleId, email;
    try {
      const verification = await appleSignin.verifyIdToken(token, {
        audience: process.env.APPLE_CLIENT_ID || 'com.buyaround.roundbuy',
        ignoreExpiration: process.env.NODE_ENV === 'development',
      });
      appleId = verification.sub;
      email = verification.email || providedEmail || (userData && userData.email);
    } catch (verifyError) {
      console.error('Apple verification error:', verifyError.message);
      // Fallback for development if needed, but strictly enforce for production
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({
          success: false,
          message: 'Invalid Apple identity token',
          error: verifyError.message
        });
      }
      // Dev fallback (use token as appleId if it's not a real token)
      appleId = token.substring(0, 50); 
      email = providedEmail || (userData && userData.email);
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for Apple Sign In. Please ensure you share your email with the app.'
      });
    }

    const resolvedFullName = full_name || (userData && userData.name ? `${userData.name.firstName || ''} ${userData.name.lastName || ''}`.trim() : null) || 'Apple User';

    // Check if user exists
    let [users] = await promisePool.query(
      "SELECT * FROM users WHERE (social_provider = 'apple' AND social_id = ?) OR email = ?",
      [appleId, email]
    );

    let userId;
    let user;

    if (users.length === 0) {
      // Create new user (verified by default since Apple verified it)
      const [result] = await promisePool.query(
        `INSERT INTO users (email, full_name, social_provider, social_id, is_verified, is_active, role)
         VALUES (?, ?, 'apple', ?, TRUE, TRUE, 'subscriber')`,
        [email, resolvedFullName, appleId]
      );
      userId = result.insertId;
      
      const [newUsers] = await promisePool.query(
        `SELECT u.*, sp.slug as subscription_plan_slug, sp.name as subscription_plan_name
         FROM users u
         LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         WHERE u.id = ?`, 
        [userId]
      );
      user = newUsers[0];
    } else {
      user = users[0];
      userId = user.id;

      // Update social info if not set
      if (!user.social_id || user.social_provider !== 'apple') {
        await promisePool.query(
          "UPDATE users SET social_provider = 'apple', social_id = ? WHERE id = ?", 
          [appleId, userId]
        );
      }
      
      // Ensure user is verified if they login via Apple
      if (!user.is_verified) {
        await promisePool.query('UPDATE users SET is_verified = TRUE WHERE id = ?', [userId]);
        user.is_verified = true;
      }
    }

    // Generate tokens
    const tokens = generateTokens(userId, user.role);

    // Check subscription
    const [subscriptions] = await promisePool.query(
      `SELECT id FROM user_subscriptions
       WHERE user_id = ? AND status = 'active' AND end_date > NOW()
       LIMIT 1`,
      [userId]
    );
    const hasSubscription = subscriptions.length > 0;

    res.json({
      success: true,
      message: 'Apple login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          full_name: user.full_name,
          role: user.role,
          user_type: user.user_type,
          is_verified: true,
          has_active_subscription: hasSubscription,
          requires_subscription: !hasSubscription,
          subscription_plan_id: user.subscription_plan_id,
          subscription_plan_slug: user.subscription_plan_slug,
          subscription_plan_name: user.subscription_plan_name,
          subscription_start_date: user.subscription_start_date,
          subscription_end_date: user.subscription_end_date,
          kyc_status: user.kyc_status,
          kyc_completed: user.kyc_completed,
          kyc_required: user.kyc_required
        },
        ...tokens,
        requires_subscription: !hasSubscription
      }
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing Apple login',
      error: error.message
    });
  }
};

/**
 * Sign in with Google for mobile app
 * POST /api/v1/mobile-app/auth/google-login
 */
const googleLogin = async (req, res) => {
  try {
    const { id_token, full_name: providedName } = req.body;

    if (!id_token) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    // Verify the token with Google
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: [
          process.env.GOOGLE_IOS_CLIENT_ID,
          process.env.GOOGLE_ANDROID_CLIENT_ID,
          process.env.GOOGLE_WEB_CLIENT_ID
        ].filter(Boolean)
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google verification error:', verifyError.message);
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({
          success: false,
          message: 'Invalid Google identity token',
          error: verifyError.message
        });
      }
      // Dev fallback if configured
      payload = {
        sub: id_token.substring(0, 50),
        email: 'test@example.com',
        name: providedName || 'Google User'
      };
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required from Google. Please ensure you share your email.'
      });
    }

    // Check if user exists
    let [users] = await promisePool.query(
      "SELECT * FROM users WHERE (social_provider = 'google' AND social_id = ?) OR email = ?",
      [googleId, email]
    );

    let userId;
    let user;

    if (users.length === 0) {
      // Create new user
      const [result] = await promisePool.query(
        `INSERT INTO users (email, full_name, social_provider, social_id, avatar, is_verified, is_active, role)
         VALUES (?, ?, 'google', ?, ?, TRUE, TRUE, 'subscriber')`,
        [email, name || providedName || 'Google User', googleId, picture]
      );
      userId = result.insertId;
      
      const [newUsers] = await promisePool.query(
        `SELECT u.*, sp.slug as subscription_plan_slug, sp.name as subscription_plan_name
         FROM users u
         LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         WHERE u.id = ?`, 
        [userId]
      );
      user = newUsers[0];
    } else {
      user = users[0];
      userId = user.id;

      // Update social info if not set
      if (!user.social_id || user.social_provider !== 'google') {
        await promisePool.query(
          "UPDATE users SET social_provider = 'google', social_id = ?, avatar = COALESCE(avatar, ?) WHERE id = ?", 
          [googleId, picture, userId]
        );
      }
      
      if (!user.is_verified) {
        await promisePool.query('UPDATE users SET is_verified = TRUE WHERE id = ?', [userId]);
        user.is_verified = true;
      }
    }

    // Generate tokens
    const tokens = generateTokens(userId, user.role);

    // Check subscription
    const [subscriptions] = await promisePool.query(
      "SELECT id FROM user_subscriptions WHERE user_id = ? AND status = 'active' AND end_date > NOW() LIMIT 1",
      [userId]
    );
    const hasSubscription = subscriptions.length > 0;

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          full_name: user.full_name,
          role: user.role,
          user_type: user.user_type,
          is_verified: true,
          has_active_subscription: hasSubscription,
          requires_subscription: !hasSubscription,
          subscription_plan_id: user.subscription_plan_id,
          subscription_plan_slug: user.subscription_plan_slug,
          subscription_plan_name: user.subscription_plan_name,
          subscription_start_date: user.subscription_start_date,
          subscription_end_date: user.subscription_end_date,
          kyc_status: user.kyc_status,
          kyc_completed: user.kyc_completed,
          kyc_required: user.kyc_required
        },
        ...tokens,
        requires_subscription: !hasSubscription
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing Google login',
      error: error.message
    });
  }
};

/**
 * Sign in with Instagram for mobile app
 * POST /api/v1/mobile-app/auth/instagram-login
 */
const instagramLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Instagram auth code is required'
      });
    }

    // 1. Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code
    });

    const { access_token, user_id: instagramId } = tokenResponse.data;

    // 2. Get user profile
    const profileResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username,name&access_token=${access_token}`);
    const { id, username, name } = profileResponse.data;

    // Note: Instagram API doesn't always return email. 
    // If email is missing, we might need a fallback or ask user to provide it.
    // For now, let's use instagramId + @instagram.com as a placeholder if email is missing,
    // OR return a special status that email is required.
    
    // Check if user exists by social_id
    let [users] = await promisePool.query(
      "SELECT * FROM users WHERE social_provider = 'instagram' AND social_id = ?",
      [instagramId]
    );

    let userId;
    let user;

    if (users.length === 0) {
      // Since email is often missing from Instagram, we'll use a placeholder
      // and potentially ask the user to update it later.
      const placeholderEmail = `${username || instagramId}@instagram.roundbuy.com`;
      
      const [result] = await promisePool.query(
        `INSERT INTO users (email, full_name, username, social_provider, social_id, is_verified, is_active, role)
         VALUES (?, ?, ?, 'instagram', ?, TRUE, TRUE, 'subscriber')`,
        [placeholderEmail, name || username || 'Instagram User', username, instagramId]
      );
      userId = result.insertId;
      
      const [newUsers] = await promisePool.query(
        `SELECT u.*, sp.slug as subscription_plan_slug, sp.name as subscription_plan_name
         FROM users u
         LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         WHERE u.id = ?`, 
        [userId]
      );
      user = newUsers[0];
    } else {
      user = users[0];
      userId = user.id;
    }

    // Generate tokens
    const tokens = generateTokens(userId, user.role);

    // Check subscription
    const [subscriptions] = await promisePool.query(
      "SELECT id FROM user_subscriptions WHERE user_id = ? AND status = 'active' AND end_date > NOW() LIMIT 1",
      [userId]
    );
    const hasSubscription = subscriptions.length > 0;

    res.json({
      success: true,
      message: 'Instagram login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          full_name: user.full_name,
          role: user.role,
          user_type: user.user_type,
          is_verified: true,
          has_active_subscription: hasSubscription,
          requires_subscription: !hasSubscription,
          subscription_plan_id: user.subscription_plan_id,
          subscription_plan_slug: user.subscription_plan_slug,
          subscription_plan_name: user.subscription_plan_name,
          subscription_start_date: user.subscription_start_date,
          subscription_end_date: user.subscription_end_date,
          kyc_status: user.kyc_status,
          kyc_completed: user.kyc_completed,
          kyc_required: user.kyc_required
        },
        ...tokens,
        requires_subscription: !hasSubscription
      }
    });
  } catch (error) {
    console.error('Instagram login error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing Instagram login',
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
  changePassword,
  appleLogin,
  googleLogin,
  instagramLogin
};