const { promisePool } = require('../config/database');

/**
 * Middleware to check if user has an active subscription
 * This should be used after the authenticate middleware
 */
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has an active subscription
    const [subscriptions] = await promisePool.query(
      `SELECT us.id, us.subscription_plan_id, us.start_date, us.end_date, us.status,
              sp.name as plan_name, sp.slug as plan_slug, sp.features
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? 
       AND us.status = 'active' 
       AND us.end_date > NOW()
       ORDER BY us.end_date DESC 
       LIMIT 1`,
      [userId]
    );

    if (subscriptions.length === 0 && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this feature',
        error_code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // Attach subscription info to request for use in controllers
    // If no subscription in dev, use a mock one
    const sub = subscriptions[0] || {
      id: 0,
      subscription_plan_id: 1,
      plan_name: 'Development Plan',
      plan_slug: 'dev',
      features: '{"max_ads": -1}',
      start_date: new Date(),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      status: 'active'
    };

    req.subscription = {
      id: sub.id,
      plan_id: sub.subscription_plan_id,
      plan_name: sub.plan_name,
      plan_slug: sub.plan_slug,
      features: JSON.parse(sub.features || '{}'),
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.status
    };

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status',
      error: error.message
    });
  }
};

/**
 * Middleware to check subscription feature limits
 * Use this for features that have usage limits (e.g., max_ads)
 * @param {string} feature - Feature name to check (e.g., 'max_ads')
 */
const checkFeatureLimit = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        return res.status(500).json({
          success: false,
          message: 'Subscription middleware must be called before checkFeatureLimit'
        });
      }

      const userId = req.user.id;
      const features = req.subscription.features;

      // Check specific feature limits
      if (feature === 'max_ads') {
        const maxAds = features.max_ads || 0;

        // -1 means unlimited
        if (maxAds === -1) {
          return next();
        }

        // Count user's current active ads
        const [countResult] = await promisePool.query(
          `SELECT COUNT(*) as count FROM advertisements 
           WHERE user_id = ? AND status IN ('draft', 'pending', 'approved', 'published')`,
          [userId]
        );

        const currentCount = countResult[0].count;

        if (currentCount >= maxAds) {
          return res.status(403).json({
            success: false,
            message: `Your ${req.subscription.plan_name} plan allows maximum ${maxAds} advertisements. Please upgrade your plan or delete existing ads.`,
            error_code: 'FEATURE_LIMIT_EXCEEDED',
            limit: {
              feature: 'max_ads',
              max: maxAds,
              current: currentCount
            }
          });
        }
      }

      // Add more feature checks as needed
      // e.g., max_banners, featured_ads, etc.

      next();
    } catch (error) {
      console.error('Feature limit check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking feature limits',
        error: error.message
      });
    }
  };
};

module.exports = {
  checkSubscription,
  checkFeatureLimit
};