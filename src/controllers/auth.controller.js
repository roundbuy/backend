const bcrypt = require('bcrypt');
const { promisePool } = require('../config/database');
const { generateTokens } = require('../utils/jwt');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, referral_code } = req.body;

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
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

    // Get free subscription plan
    const [freePlans] = await promisePool.query(
      'SELECT id FROM subscription_plans WHERE slug = "free" LIMIT 1'
    );

    const subscriptionPlanId = freePlans.length > 0 ? freePlans[0].id : null;

    // Generate username
    const username = `user${Math.random().toString(36).substring(2, 10)}`;

    // Create user
    const [result] = await promisePool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, subscription_plan_id, username, profile_image) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, password_hash, full_name, phone || null, subscriptionPlanId, username, 'https://via.placeholder.com/150']
    );

    const userId = result.insertId;

    // Handle Referral Code
    if (referral_code) {
      try {
        // Find referrer
        const [referrers] = await promisePool.query(
          'SELECT id FROM users WHERE referral_code = ?',
          [referral_code]
        );

        if (referrers.length > 0) {
          const referrerId = referrers[0].id;

          // Create referral record
          await promisePool.query(
            'INSERT INTO referrals (referrer_id, referee_id, status) VALUES (?, ?, ?)',
            [referrerId, userId, 'pending'] // Mark as pending until they do something? Or 'completed' if just signup counts?
            // Requirement says "Refer 5 friends to register", so seemingly just registration counts.
            // Let's mark as 'completed' for now or 'pending' if verification is needed.
            // Let's default to 'pending' from schema, but maybe strictly 'completed' if email verified?
            // For now, let's just insert.
          );

          // Check if we should auto-complete it based on requirements? 
          // "Give this referral code to 5 friends to register" -> implies registration is enough.
          // Let's set it to 'completed' immediately for this MVP loop, or update it later.
          // The schema default is 'pending'. Let's stick to 'pending' and maybe have a trigger or service update it.
          // actually, "Receive Gold membership for free" -> Usually valid after email verification.
          // I'll stick to 'pending'.

          // Actually, for the sake of the demo seeing the progress bar move, I should probably make it 'completed' 
          // or have a way to complete it. 
          // Let's make it 'completed' for immediate gratification in testing unless email verification is strictly enforced.
          await promisePool.query(
            'UPDATE referrals SET status = "completed" WHERE id = LAST_INSERT_ID()'
          );
          // Also update the referrer's progress if needed? 
          // No, the `getRewards` logic just queries the counts or we need to update `user_rewards_progress`.
          // The database schema has `user_rewards_progress`.
          // We should probably update that too if we want the UI progress bar to move!

          // Wait, the `RewardsController.getRewards` does this:
          // `const [progress] = await db.query('SELECT * FROM user_rewards_progress WHERE user_id = ?', [userId]);`
          // This fetches progress for the VIEWING user.
          // If I am the referrer, I want to see my progress increase.
          // So when a referee signs up, we should update the REFERRER's progress in `user_rewards_progress`.

          // Let's find the relevant reward category (e.g., id 1 for Plan Upgrade)
          const [rewardCategories] = await promisePool.query(
            'SELECT id, required_referrals FROM reward_categories WHERE type = "plan_upgrade"'
          );

          if (rewardCategories.length > 0) {
            const cat = rewardCategories[0];
            // Check if record exists
            const [prog] = await promisePool.query(
              'SELECT * FROM user_rewards_progress WHERE user_id = ? AND reward_category_id = ?',
              [referrerId, cat.id]
            );

            if (prog.length === 0) {
              await promisePool.query(
                'INSERT INTO user_rewards_progress (user_id, reward_category_id, progress_count) VALUES (?, ?, 1)',
                [referrerId, cat.id]
              );
            } else {
              await promisePool.query(
                'UPDATE user_rewards_progress SET progress_count = progress_count + 1 WHERE id = ?',
                [prog[0].id]
              );
            }
          }
        }
      } catch (refError) {
        console.error('Referral processing error:', refError);
        // Don't fail registration if referral fails
      }
    }

    // Generate tokens
    const tokens = generateTokens(userId, 'subscriber');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userId,
          email,
          full_name,
          role: 'subscriber'
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * Login user
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
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = ?',
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Get current user
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await promisePool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar, u.role, 
              u.is_verified, u.language_preference, u.created_at,
              sp.name as subscription_plan_name, sp.slug as subscription_plan_slug, sp.plan_type,
              u.subscription_start_date, u.subscription_end_date
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const { verifyRefreshToken } = require('../utils/jwt');
    let decoded;

    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const userId = decoded.userId;

    // Check if user still exists and is active
    const [users] = await promisePool.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

/**
 * Logout (client-side token removal mainly)
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  logout
};