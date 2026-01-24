const { promisePool } = require('../../config/database');
const { sendWelcomeEmail } = require('../../services/email.service');

// Function to get Stripe instance with configured key
const getStripeInstance = async () => {
  // Get Stripe secret key from database settings
  const [settings] = await promisePool.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key' LIMIT 1"
  );

  if (settings.length === 0) {
    throw new Error('Stripe secret key not configured');
  }

  return require('stripe')(settings[0].setting_value);
};

/**
 * Get available subscription plans with multi-currency pricing
 * GET /api/v1/mobile-app/subscription/plans
 */
const getPlans = async (req, res) => {
  try {
    const { currency_code, language = 'en' } = req.query;

    // Get default currency if not specified
    let defaultCurrencyCode = 'INR'; // Default to INR
    if (!currency_code) {
      const [settings] = await promisePool.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'currency' LIMIT 1"
      );
      if (settings.length > 0) {
        defaultCurrencyCode = settings[0].setting_value;
      }
    }

    const targetCurrency = currency_code || defaultCurrencyCode;

    // Get all active subscription plans
    const [plans] = await promisePool.query(
      `SELECT id, name, slug, subheading, description, description_bullets,
              duration_days, features, color_hex, tag, renewal_price, sort_order
       FROM subscription_plans
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
    );

    // Get all currencies
    const [currencies] = await promisePool.query(
      'SELECT id, code, name, symbol, is_default FROM currencies WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );

    // Get prices for all plans and currencies
    const [planPrices] = await promisePool.query(
      `SELECT pp.subscription_plan_id, pp.currency_id, pp.price, pp.tax_rate,
              c.code as currency_code, c.symbol, c.name as currency_name, c.is_default
       FROM plan_prices pp
       JOIN currencies c ON pp.currency_id = c.id
       WHERE c.is_active = TRUE
       ORDER BY pp.subscription_plan_id, c.is_default DESC`
    );

    // Organize prices by plan
    const pricesByPlan = {};
    planPrices.forEach(price => {
      if (!pricesByPlan[price.subscription_plan_id]) {
        pricesByPlan[price.subscription_plan_id] = [];
      }
      pricesByPlan[price.subscription_plan_id].push({
        currency_code: price.currency_code,
        currency_name: price.currency_name,
        symbol: price.symbol,
        price: parseFloat(price.price),
        tax_rate: parseFloat(price.tax_rate),
        is_default: price.is_default
      });
    });

    // Build response
    const plansWithPrices = plans.map(plan => {
      const prices = pricesByPlan[plan.id] || [];

      // Calculate total price with tax for target currency
      const targetPrice = prices.find(p => p.currency_code === targetCurrency);
      let totalPrice = 0;
      let taxAmount = 0;

      if (targetPrice) {
        const price = targetPrice.price;
        const taxRate = targetPrice.tax_rate;
        taxAmount = (price * taxRate) / 100;
        totalPrice = price + taxAmount;
      }

      // Calculate renewal price
      const renewalPrice = plan.renewal_price || (targetPrice ? targetPrice.price : 0);
      const renewalTaxAmount = targetPrice ? (renewalPrice * targetPrice.tax_rate) / 100 : 0;
      const renewalTotalPrice = renewalPrice + renewalTaxAmount;

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        subheading: plan.subheading,
        subtitle: plan.subheading || plan.description,
        description: plan.description,
        description_bullets: plan.description_bullets ? (typeof plan.description_bullets === 'string' ? JSON.parse(plan.description_bullets) : plan.description_bullets) : [],
        duration_days: plan.duration_days,
        features: plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : {},
        color: plan.color_hex || '#4CAF50',
        tag: plan.tag, // 'best', 'popular', 'recommended', or null
        prices: prices,
        target_currency: {
          code: targetCurrency,
          price: targetPrice ? targetPrice.price : 0,
          tax_rate: targetPrice ? targetPrice.tax_rate : 0,
          tax_amount: taxAmount,
          total_price: totalPrice,
          symbol: targetPrice ? targetPrice.symbol : ''
        },
        renewal: {
          price: renewalPrice,
          tax_amount: renewalTaxAmount,
          total_price: renewalTotalPrice,
          is_different: plan.renewal_price != null && plan.renewal_price !== (targetPrice ? targetPrice.price : 0)
        },
        sort_order: plan.sort_order,
        is_best: false, // Will be set below
        is_popular: false // Will be set below
      };
    });

    // Mark plans with tags
    plansWithPrices.forEach(plan => {
      if (plan.tag === 'best') {
        plan.is_best = true;
      }
      if (plan.tag === 'popular') {
        plan.is_popular = true;
      }
    });

    res.json({
      success: true,
      data: {
        plans: plansWithPrices,
        currencies: currencies.map(c => ({
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          is_default: c.is_default
        })),
        default_currency: defaultCurrencyCode,
        target_currency: targetCurrency,
        language: language
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

/**
 * Get specific plan details
 * GET /api/v1/mobile-app/subscription/plans/:planId
 */
const getPlanDetails = async (req, res) => {
  try {
    const { planId } = req.params;
    const { currency_code, language = 'en' } = req.query;

    // Get plan
    const [plans] = await promisePool.query(
      'SELECT id, name, slug, description, duration_days, features FROM subscription_plans WHERE id = ? AND is_active = TRUE',
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const plan = plans[0];

    // Get prices for this plan
    const [planPrices] = await promisePool.query(
      `SELECT pp.price, pp.tax_rate, c.code, c.symbol, c.name, c.is_default
       FROM plan_prices pp
       JOIN currencies c ON pp.currency_id = c.id
       WHERE pp.subscription_plan_id = ? AND c.is_active = TRUE
       ORDER BY c.is_default DESC`,
      [planId]
    );

    // Get default currency
    let defaultCurrencyCode = 'INR';
    const [settings] = await promisePool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'currency' LIMIT 1"
    );
    if (settings.length > 0) {
      defaultCurrencyCode = settings[0].setting_value;
    }

    const targetCurrency = currency_code || defaultCurrencyCode;
    const targetPrice = planPrices.find(p => p.code === targetCurrency);

    let totalPrice = 0;
    let taxAmount = 0;

    if (targetPrice) {
      const price = parseFloat(targetPrice.price);
      const taxRate = parseFloat(targetPrice.tax_rate);
      taxAmount = (price * taxRate) / 100;
      totalPrice = price + taxAmount;
    }

    res.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          duration_days: plan.duration_days,
          features: plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : {},
          prices: planPrices.map(p => ({
            currency_code: p.code,
            currency_name: p.name,
            symbol: p.symbol,
            price: parseFloat(p.price),
            tax_rate: parseFloat(p.tax_rate),
            is_default: p.is_default
          })),
          target_currency: targetPrice ? {
            code: targetCurrency,
            price: parseFloat(targetPrice.price),
            tax_rate: parseFloat(targetPrice.tax_rate),
            tax_amount: taxAmount,
            total_price: totalPrice,
            symbol: targetPrice.symbol
          } : null
        },
        default_currency: defaultCurrencyCode,
        target_currency: targetCurrency,
        language: language
      }
    });
  } catch (error) {
    console.error('Get plan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plan details',
      error: error.message
    });
  }
};

/**
 * Create payment intent for subscription purchase
 * POST /api/v1/mobile-app/subscription/create-payment-intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { plan_id, currency_code } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!plan_id || !currency_code) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and currency code are required'
      });
    }

    // Get plan and price
    const [plans] = await promisePool.query(
      `SELECT sp.id, sp.name, sp.duration_days, pp.price, pp.tax_rate, c.code as currency_code
       FROM subscription_plans sp
       JOIN plan_prices pp ON sp.id = pp.subscription_plan_id
       JOIN currencies c ON pp.currency_id = c.id
       WHERE sp.id = ? AND c.code = ? AND sp.is_active = TRUE`,
      [plan_id, currency_code]
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or not available in selected currency'
      });
    }

    const plan = plans[0];
    const price = parseFloat(plan.price);
    const taxRate = parseFloat(plan.tax_rate);
    const taxAmount = (price * taxRate) / 100;
    const totalAmount = price + taxAmount;

    // Get user details
    const [users] = await promisePool.query(
      'SELECT email, full_name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const stripe = await getStripeInstance();

    // Create or get Stripe customer
    let stripeCustomerId = null;
    const [existingCustomers] = await promisePool.query(
      'SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
      [userId]
    );

    if (existingCustomers.length > 0) {
      stripeCustomerId = existingCustomers[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: userId
        }
      });
      stripeCustomerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency_code.toLowerCase(),
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId,
        plan_id: plan_id,
        plan_name: plan.name,
        currency: currency_code
      }
    });

    res.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        currency: currency_code,
        customer_id: stripeCustomerId
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

/**
 * Purchase subscription plan
 * POST /api/v1/mobile-app/subscription/purchase
 */
const purchasePlan = async (req, res) => {
  try {
    const { plan_id, currency_code, payment_method_id, save_payment_method = false, country, zip_code, auto_renew = false } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!plan_id || !currency_code || !payment_method_id) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID, currency code, and payment method ID are required'
      });
    }

    // Get plan and price
    const [plans] = await promisePool.query(
      `SELECT sp.id, sp.name, sp.duration_days, pp.price, pp.tax_rate, c.code as currency_code
       FROM subscription_plans sp
       JOIN plan_prices pp ON sp.id = pp.subscription_plan_id
       JOIN currencies c ON pp.currency_id = c.id
       WHERE sp.id = ? AND c.code = ? AND sp.is_active = TRUE`,
      [plan_id, currency_code]
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or not available in selected currency'
      });
    }

    const plan = plans[0];
    const price = parseFloat(plan.price);
    const taxRate = parseFloat(plan.tax_rate);
    const taxAmount = (price * taxRate) / 100;
    const totalAmount = price + taxAmount;

    // Check if user already has an active subscription
    const [existingSubs] = await promisePool.query(
      'SELECT id FROM user_subscriptions WHERE user_id = ? AND status = "active"',
      [userId]
    );

    if (existingSubs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Get user details for Stripe customer
    const [users] = await promisePool.query(
      'SELECT email, full_name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const stripe = await getStripeInstance();

    // Create or get Stripe customer
    let stripeCustomerId = null;
    const [existingCustomers] = await promisePool.query(
      'SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
      [userId]
    );

    if (existingCustomers.length > 0) {
      stripeCustomerId = existingCustomers[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: userId
        }
      });
      stripeCustomerId = customer.id;
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency_code.toLowerCase(),
      customer: stripeCustomerId,
      payment_method: payment_method_id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId,
        plan_id: plan_id,
        plan_name: plan.name,
        currency: currency_code
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        payment_status: paymentIntent.status
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Calculate renewal price
    const [planDetails] = await promisePool.query(
      'SELECT renewal_price FROM subscription_plans WHERE id = ?',
      [plan_id]
    );
    const renewalPrice = planDetails[0].renewal_price;

    // Create user subscription
    const [subResult] = await promisePool.query(
      `INSERT INTO user_subscriptions
       (user_id, subscription_plan_id, start_date, end_date, status,
        stripe_customer_id, payment_id, payment_method, amount_paid, currency_code,
        auto_renew, renewal_price)
       VALUES (?, ?, ?, ?, 'active', ?, ?, 'stripe', ?, ?, ?, ?)`,
      [userId, plan_id, startDate, endDate, stripeCustomerId, paymentIntent.id,
        totalAmount, currency_code, auto_renew, renewalPrice]
    );

    // Update user's subscription
    await promisePool.query(
      'UPDATE users SET subscription_plan_id = ?, subscription_start_date = ?, subscription_end_date = ? WHERE id = ?',
      [plan_id, startDate, endDate, userId]
    );

    // Send welcome email
    if (user) {
      try {
        await sendWelcomeEmail(user.email, user.full_name, {
          planName: plan.name,
          startDate,
          endDate,
          amountPaid: totalAmount,
          currency: currency_code
        });
        console.log(`✅ Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError.message);
        // Continue even if email fails
      }
    }

    // Save payment method if requested
    if (save_payment_method) {
      try {
        const stripeInstance = await getStripeInstance();
        const paymentMethod = await stripeInstance.paymentMethods.retrieve(payment_method_id);
        await promisePool.query(
          `INSERT INTO saved_payment_methods
           (user_id, payment_method_type, provider, provider_payment_method_id, last_four, card_brand, expiry_month, expiry_year)
           VALUES (?, 'card', 'stripe', ?, ?, ?, ?, ?)`,
          [
            userId,
            payment_method_id,
            paymentMethod.card.last4,
            paymentMethod.card.brand,
            paymentMethod.card.exp_month,
            paymentMethod.card.exp_year
          ]
        );
      } catch (error) {
        console.error('Error saving payment method:', error);
        // Don't fail the purchase if saving payment method fails
      }
    }

    res.json({
      success: true,
      message: 'Subscription purchased successfully',
      data: {
        subscription: {
          id: subResult.insertId,
          plan_name: plan.name,
          start_date: startDate,
          end_date: endDate,
          amount_paid: totalAmount,
          currency: currency_code,
          payment_id: paymentIntent.id
        },
        transaction: {
          id: paymentIntent.id,
          amount: totalAmount,
          currency: currency_code,
          status: 'completed',
          timestamp: new Date().toISOString(),
          session_id: paymentIntent.id // Using payment intent ID as session ID
        }
      }
    });
  } catch (error) {
    console.error('Purchase plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing subscription',
      error: error.message
    });
  }
};

/**
 * Get transaction status
 * GET /api/v1/mobile-app/subscription/transaction/:transactionId
 */
const getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    // Find user subscription by payment_id
    const [subscriptions] = await promisePool.query(
      `SELECT us.id, us.start_date, us.end_date, us.status, us.payment_id, us.amount_paid,
              sp.name as plan_name, c.code as currency_code
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       JOIN currencies c ON c.code = ?
       WHERE us.user_id = ? AND us.payment_id = ?
       ORDER BY us.created_at DESC LIMIT 1`,
      ['INR', userId, transactionId] // Assuming INR for now, can be enhanced
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const subscription = subscriptions[0];

    res.json({
      success: true,
      data: {
        transaction: {
          id: subscription.payment_id,
          amount: parseFloat(subscription.amount_paid),
          currency: subscription.currency_code,
          status: 'completed', // Since we only store completed transactions
          timestamp: subscription.start_date,
          session_id: subscription.payment_id
        },
        subscription: {
          id: subscription.id,
          plan_name: subscription.plan_name,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          status: subscription.status
        }
      }
    });
  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction status',
      error: error.message
    });
  }
};

/**
 * Get saved payment methods
 * GET /api/v1/mobile-app/subscription/payment-methods
 */
const getSavedPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const [paymentMethods] = await promisePool.query(
      `SELECT id, payment_method_type, provider, last_four, card_brand,
              expiry_month, expiry_year, is_default, created_at
       FROM saved_payment_methods
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        payment_methods: paymentMethods.map(pm => ({
          id: pm.id,
          type: pm.payment_method_type,
          provider: pm.provider,
          last_four: pm.last_four,
          card_brand: pm.card_brand,
          expiry_month: pm.expiry_month,
          expiry_year: pm.expiry_year,
          is_default: pm.is_default,
          created_at: pm.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get saved payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved payment methods',
      error: error.message
    });
  }
};

/**
 * Get Stripe configuration for frontend
 * GET /api/v1/mobile-app/subscription/stripe-config
 */
const getStripeConfig = async (req, res) => {
  try {
    // Get Stripe publishable key from settings
    const [settings] = await promisePool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'stripe_publishable_key' LIMIT 1"
    );

    const publishableKey = settings.length > 0 ? settings[0].setting_value : '';

    res.json({
      success: true,
      data: {
        stripe_publishable_key: publishableKey
      }
    });
  } catch (error) {
    console.error('Get Stripe config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Stripe configuration',
      error: error.message
    });
  }
};

/**
 * Activate free plan (Green plan) - allows activation for new users after email verification
 * POST /api/v1/mobile-app/subscription/activate-free
 */
const activateFreePlan = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if we have email in body (for new users) or user ID from auth (for logged in users)
    let userId;
    let userEmail;

    if (email) {
      // New user flow - get user by email after email verification
      const [users] = await promisePool.query(
        'SELECT id, email FROM users WHERE email = ? AND is_verified = TRUE LIMIT 1',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found or email not verified'
        });
      }

      userId = users[0].id;
      userEmail = users[0].email;
    } else {
      // Logged in user flow
      userId = req.user.id;
      userEmail = req.user.email;
    }

    // Get the free/green plan
    const [plans] = await promisePool.query(
      `SELECT id, name, slug, duration_days FROM subscription_plans 
       WHERE (slug = 'green' OR name = 'Green') AND is_active = TRUE
       LIMIT 1`
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Free plan not found'
      });
    }

    const plan = plans[0];

    // Check if user already has an active subscription
    const [existingSubs] = await promisePool.query(
      'SELECT id FROM user_subscriptions WHERE user_id = ? AND status = "active" AND end_date > NOW()',
      [userId]
    );

    if (existingSubs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create user subscription for free plan
    const [subResult] = await promisePool.query(
      `INSERT INTO user_subscriptions
       (user_id, subscription_plan_id, start_date, end_date, status,
        payment_method, amount_paid, currency_code, auto_renew)
       VALUES (?, ?, ?, ?, 'active', 'free', 0, 'INR', FALSE)`,
      [userId, plan.id, startDate, endDate]
    );

    // Update user's subscription
    await promisePool.query(
      'UPDATE users SET subscription_plan_id = ?, subscription_start_date = ?, subscription_end_date = ? WHERE id = ?',
      [plan.id, startDate, endDate, userId]
    );

    res.json({
      success: true,
      message: 'Free plan activated successfully',
      data: {
        subscription: {
          id: subResult.insertId,
          plan_name: plan.name,
          plan_slug: plan.slug,
          start_date: startDate,
          end_date: endDate,
          amount_paid: 0,
          currency: 'INR'
        }
      }
    });
  } catch (error) {
    console.error('Activate free plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating free plan',
      error: error.message
    });
  }
};

/**
 * Create Payment Method (Server-side tokenization)
 * POST /api/v1/mobile-app/subscription/create-payment-method
 */
const createPaymentMethod = async (req, res) => {
  try {
    const { card_number, exp_month, exp_year, cvc, billing_details } = req.body;

    // Validate required fields
    if (!card_number || !exp_month || !exp_year || !cvc) {
      return res.status(400).json({
        success: false,
        message: 'Card details are required',
        error_code: 'VALIDATION_ERROR'
      });
    }

    // Get Stripe instance
    const stripe = await getStripeInstance();

    // Convert 2-digit year to 4-digit if needed
    let fullYear = parseInt(exp_year);
    if (fullYear < 100) {
      // 2-digit year (e.g., 25) -> convert to 4-digit (e.g., 2025)
      fullYear = 2000 + fullYear;
    }

    // Step 1: Create a token (Tokens API doesn't require raw card data setting)
    const token = await stripe.tokens.create({
      card: {
        number: card_number,
        exp_month: parseInt(exp_month),
        exp_year: fullYear,
        cvc: cvc
      }
    });

    // Step 2: Create payment method from token
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: token.id
      },
      billing_details: billing_details || {}
    });

    res.json({
      success: true,
      data: {
        payment_method_id: paymentMethod.id
      }
    });
  } catch (error) {
    console.error('Create payment method error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      raw: error.raw
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment method',
      error_code: 'PAYMENT_METHOD_ERROR'
    });
  }
};

module.exports = {
  getPlans,
  getPlanDetails,
  createPaymentIntent,
  createPaymentMethod,
  purchasePlan,
  activateFreePlan,
  getTransactionStatus,
  getSavedPaymentMethods,
  getStripeConfig
};