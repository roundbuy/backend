const { getPaddleClient } = require('../../config/paddle');
const { promisePool } = require('../../config/database');
const crypto = require('crypto');

/**
 * Get Paddle client token for frontend
 * GET /api/v1/mobile-app/paddle/client-token
 */
exports.getClientToken = async (req, res) => {
  try {
    const clientToken = process.env.PADDLE_CLIENT_TOKEN;
    
    if (!clientToken) {
      return res.status(500).json({
        success: false,
        message: 'Paddle client token not configured'
      });
    }

    res.json({
      success: true,
      data: {
        client_token: clientToken,
        environment: process.env.PADDLE_ENVIRONMENT || 'sandbox'
      }
    });
  } catch (error) {
    console.error('Get Paddle client token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Paddle configuration',
      error: error.message
    });
  }
};

/**
 * Create a Paddle transaction
 * POST /api/v1/mobile-app/paddle/create-transaction
 */
exports.createTransaction = async (req, res) => {
  try {
    const { plan_id, currency_code, items } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!plan_id || !currency_code) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and currency code are required'
      });
    }

    // Get plan details
    const [plans] = await promisePool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [plan_id]
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const plan = plans[0];

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
    const paddle = getPaddleClient();

    // Create transaction with Paddle
    const transaction = await paddle.transactions.create({
      items: items || [{
        priceId: plan.paddle_price_id, // You'll need to add this field to subscription_plans table
        quantity: 1
      }],
      customData: {
        userId: userId.toString(),
        planId: plan_id.toString()
      },
      customerEmail: user.email,
      currencyCode: currency_code
    });

    res.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        checkout_url: transaction.checkoutUrl,
        customer_id: transaction.customerId,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Create Paddle transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

/**
 * Get transaction details
 * GET /api/v1/mobile-app/paddle/transaction/:transactionId
 */
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const paddle = getPaddleClient();

    const transaction = await paddle.transactions.get(transactionId);

    res.json({
      success: true,
      data: {
        id: transaction.id,
        status: transaction.status,
        customer_id: transaction.customerId,
        currency_code: transaction.currencyCode,
        total: transaction.details.totals.total,
        items: transaction.items,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt
      }
    });
  } catch (error) {
    console.error('Get Paddle transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
};

/**
 * Handle Paddle webhooks
 * POST /api/v1/mobile-app/paddle/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['paddle-signature'];
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Paddle webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== `h1=${expectedSignature}`) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    console.log('Paddle webhook received:', event.event_type);

    switch (event.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
      
      case 'transaction.paid':
        await handleTransactionPaid(event.data);
        break;

      case 'transaction.payment_failed':
        await handleTransactionFailed(event.data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;

      default:
        console.log('Unhandled webhook event:', event.event_type);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for webhook events
async function handleTransactionCompleted(data) {
  try {
    const customData = data.custom_data || {};
    const userId = customData.userId;
    const planId = customData.planId;

    if (!userId || !planId) {
      console.error('Missing custom data in transaction:', data.id);
      return;
    }

    // Get plan details
    const [plans] = await promisePool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [planId]
    );

    if (plans.length === 0) {
      console.error('Plan not found:', planId);
      return;
    }

    const plan = plans[0];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create subscription record
    await promisePool.query(
      `INSERT INTO user_subscriptions 
       (user_id, subscription_plan_id, start_date, end_date, status,
        paddle_customer_id, payment_id, payment_method, amount_paid, currency_code)
       VALUES (?, ?, ?, ?, 'active', ?, ?, 'paddle', ?, ?)`,
      [
        userId,
        planId,
        startDate,
        endDate,
        data.customer_id,
        data.id,
        data.details.totals.total / 100, // Convert from cents
        data.currency_code
      ]
    );

    console.log('Subscription created for user:', userId);
  } catch (error) {
    console.error('Error handling transaction completed:', error);
  }
}

async function handleTransactionPaid(data) {
  try {
    await promisePool.query(
      `UPDATE user_subscriptions 
       SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE payment_id = ?`,
      [data.id]
    );
    console.log('Transaction paid:', data.id);
  } catch (error) {
    console.error('Error handling transaction paid:', error);
  }
}

async function handleTransactionFailed(data) {
  try {
    await promisePool.query(
      `UPDATE user_subscriptions 
       SET status = 'payment_failed', updated_at = CURRENT_TIMESTAMP
       WHERE payment_id = ?`,
      [data.id]
    );
    console.log('Transaction failed:', data.id);
  } catch (error) {
    console.error('Error handling transaction failed:', error);
  }
}

async function handleSubscriptionCreated(data) {
  console.log('Subscription created:', data.id);
  // Additional subscription logic if needed
}

async function handleSubscriptionUpdated(data) {
  try {
    const customData = data.custom_data || {};
    const userId = customData.userId;

    if (userId) {
      // Update subscription status
      await promisePool.query(
        `UPDATE user_subscriptions 
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE paddle_customer_id = ? AND user_id = ?`,
        [data.status, data.customer_id, userId]
      );
    }
    console.log('Subscription updated:', data.id);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCanceled(data) {
  try {
    await promisePool.query(
      `UPDATE user_subscriptions 
       SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
       WHERE paddle_customer_id = ?`,
      [data.customer_id]
    );
    console.log('Subscription canceled:', data.id);
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

/**
 * Get prices from Paddle
 * GET /api/v1/mobile-app/paddle/prices
 */
exports.getPrices = async (req, res) => {
  try {
    const paddle = getPaddleClient();
    const prices = await paddle.prices.list();

    res.json({
      success: true,
      data: {
        prices: prices.data.map(price => ({
          id: price.id,
          product_id: price.productId,
          description: price.description,
          unit_price: price.unitPrice,
          currency_code: price.unitPrice.currencyCode,
          amount: price.unitPrice.amount
        }))
      }
    });
  } catch (error) {
    console.error('Get Paddle prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prices',
      error: error.message
    });
  }
};