const { promisePool } = require('../../config/database');
const { createNotificationForUser } = require('../../utils/notificationHelper');

/**
 * GET /api/v1/mobile-app/checkout/quick-config/:advertisementId
 * Returns everything the frontend needs to render the 1-click buy confirmation overlay:
 * – item details, price, fees breakdown, default payment method card info
 */
exports.getQuickConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const { advertisementId } = req.params;

    // 1. Advertisement
    const [ads] = await promisePool.execute(
      `SELECT a.id, a.title, a.price, a.images, a.user_id as seller_id, a.status, u.full_name as seller_name
       FROM advertisements a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [advertisementId]
    );
    if (!ads.length) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const ad = ads[0];
    if (ad.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This item is no longer available' });
    }
    if (ad.seller_id === userId) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own item' });
    }

    // 2. System fees from settings table
    const [feeRows] = await promisePool.query(
      `SELECT setting_key, setting_value FROM settings
       WHERE setting_key IN ('buyer_fee_fixed', 'item_value_fee_percent', 'cancellation_window_minutes')`
    );
    const feeMap = {};
    feeRows.forEach(r => { feeMap[r.setting_key] = r.setting_value; });

    const buyerFeeFixed    = parseFloat(feeMap.buyer_fee_fixed    || '1.00');
    const itemValueFeePct  = parseFloat(feeMap.item_value_fee_percent || '2.7');
    const cancelWindowMins = parseInt(feeMap.cancellation_window_minutes || '30', 10);

    const itemPrice       = parseFloat(ad.price);
    const itemValueFee    = parseFloat(((itemPrice * itemValueFeePct) / 100).toFixed(2));
    const totalAmount     = parseFloat((itemPrice + buyerFeeFixed + itemValueFee).toFixed(2));

    // 3. User's default payment method
    const [pmRows] = await promisePool.execute(
      `SELECT id, payment_method_type, provider, provider_payment_method_id,
              last_four, card_brand, expiry_month, expiry_year
       FROM saved_payment_methods
       WHERE user_id = ? AND is_default = 1 AND is_active = 1
       LIMIT 1`,
      [userId]
    );
    const defaultPaymentMethod = pmRows[0] || null;

    // 4. Check if user has any saved payment method at all
    const [anyPmRows] = await promisePool.execute(
      'SELECT COUNT(*) as cnt FROM saved_payment_methods WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    const hasAnySavedMethod = anyPmRows[0].cnt > 0;

    // Parse images
    let images = [];
    try {
      images = ad.images ? JSON.parse(ad.images) : [];
    } catch (_) {}

    res.json({
      success: true,
      data: {
        item: {
          id: ad.id,
          title: ad.title,
          price: itemPrice,
          image: images[0] || null,
          seller_name: ad.seller_name || 'Seller',
        },
        fees: {
          item_price: itemPrice,
          buyer_fee_fixed: buyerFeeFixed,
          item_value_fee: itemValueFee,
          item_value_fee_pct: itemValueFeePct,
          total_amount: totalAmount,
        },
        cancellation_window_minutes: cancelWindowMins,
        default_payment_method: defaultPaymentMethod,
        has_any_saved_method: hasAnySavedMethod,
      }
    });
  } catch (error) {
    console.error('Quick config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/v1/mobile-app/checkout/quick-buy
 * 1-click purchase using the user's default saved Stripe payment method.
 * Body: { advertisementId, deliveryOption? }
 */
exports.quickBuy = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { advertisementId, deliveryOption = 'pickup' } = req.body;

    if (!advertisementId) {
      return res.status(400).json({ success: false, message: 'advertisementId is required' });
    }

    // 1. Lock and fetch advertisement
    const [ads] = await connection.execute(
      'SELECT id, title, price, images, user_id as seller_id, status FROM advertisements WHERE id = ? FOR UPDATE',
      [advertisementId]
    );
    if (!ads.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const ad = ads[0];

    if (ad.status !== 'published') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This item is no longer available' });
    }
    if (ad.seller_id === userId) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'You cannot buy your own item' });
    }

    // 2. Get default payment method
    const [pmRows] = await connection.execute(
      `SELECT id, provider_payment_method_id, provider
       FROM saved_payment_methods
       WHERE user_id = ? AND is_default = 1 AND is_active = 1 LIMIT 1`,
      [userId]
    );
    if (!pmRows.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error_code: 'NO_DEFAULT_PAYMENT',
        message: 'No default payment method set. Please add a payment method first.'
      });
    }
    const pm = pmRows[0];

    // 3. Get user's Stripe customer ID
    const [userRows] = await connection.execute(
      'SELECT stripe_customer_id, full_name FROM users WHERE id = ?',
      [userId]
    );
    if (!userRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { stripe_customer_id, full_name } = userRows[0];

    // 4. Compute fees from settings
    const [feeRows] = await connection.execute(
      `SELECT setting_key, setting_value FROM settings
       WHERE setting_key IN ('buyer_fee_fixed', 'item_value_fee_percent', 'cancellation_window_minutes', 'stripe_secret_key')`
    );
    const feeMap = {};
    feeRows.forEach(r => { feeMap[r.setting_key] = r.setting_value; });

    const buyerFeeFixed    = parseFloat(feeMap.buyer_fee_fixed    || '1.00');
    const itemValueFeePct  = parseFloat(feeMap.item_value_fee_percent || '2.7');
    const cancelWindowMins = parseInt(feeMap.cancellation_window_minutes || '30', 10);
    const stripeSecretKey  = feeMap.stripe_secret_key || process.env.STRIPE_SECRET_KEY;

    const itemPrice    = parseFloat(ad.price);
    const itemValueFee = parseFloat(((itemPrice * itemValueFeePct) / 100).toFixed(2));
    const totalAmount  = parseFloat((itemPrice + buyerFeeFixed + itemValueFee).toFixed(2));

    let stripePaymentIntentId = null;
    let stripeChargeId = null;

    // 5. Charge via Stripe (if key available)
    if (stripeSecretKey && !stripeSecretKey.includes('dummy')) {
      try {
        const stripe = require('stripe')(stripeSecretKey);

        let customerId = stripe_customer_id;

        // Create Stripe customer if not yet registered
        if (!customerId) {
          const [emailRows] = await connection.execute('SELECT email FROM users WHERE id = ?', [userId]);
          const customer = await stripe.customers.create({
            email: emailRows[0]?.email,
            name: full_name,
            metadata: { roundbuy_user_id: String(userId) }
          });
          customerId = customer.id;
          await connection.execute(
            'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
            [customerId, userId]
          );
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // pence
          currency: 'gbp',
          customer: customerId,
          payment_method: pm.provider_payment_method_id,
          confirm: true,
          off_session: true, // no 3DS redirect needed
          description: `RoundBuy purchase: ${ad.title}`,
          metadata: {
            advertisement_id: String(advertisementId),
            buyer_id: String(userId),
            seller_id: String(ad.seller_id)
          }
        });

        stripePaymentIntentId = paymentIntent.id;
        stripeChargeId = paymentIntent.latest_charge || null;

        if (paymentIntent.status !== 'succeeded') {
          await connection.rollback();
          return res.status(402).json({
            success: false,
            error_code: 'PAYMENT_FAILED',
            message: 'Payment could not be completed. Please check your card.'
          });
        }
      } catch (stripeErr) {
        await connection.rollback();
        console.error('Stripe error:', stripeErr);
        const userMsg = stripeErr.type === 'StripeCardError'
          ? (stripeErr.message || 'Card declined')
          : 'Payment processing failed. Please try again.';
        return res.status(402).json({ success: false, error_code: 'PAYMENT_FAILED', message: userMsg });
      }
    }

    // 6. Create quick_order record
    const cancelWindowExpiry = new Date(Date.now() + cancelWindowMins * 60 * 1000);
    const [orderResult] = await connection.execute(
      `INSERT INTO quick_orders
       (buyer_id, seller_id, advertisement_id, amount, buyer_fee, item_value_fee, total_amount,
        stripe_payment_intent_id, stripe_charge_id, payment_method_id,
        payment_status, order_status, delivery_option, cancellation_window_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'confirmed', ?, ?)`,
      [
        userId, ad.seller_id, advertisementId,
        itemPrice, buyerFeeFixed, itemValueFee, totalAmount,
        stripePaymentIntentId, stripeChargeId, pm.id,
        deliveryOption, cancelWindowExpiry
      ]
    );
    const quickOrderId = orderResult.insertId;

    // 6b. Also create a legacy order record for system-wide compatibility (pickups, deal confirmation, chats, etc.)
    let legacyOrderId = null;
    try {
      const notesJson = JSON.stringify({ deliveryOption: deliveryOption });
      const [legacyOrderResult] = await connection.execute(
        `INSERT INTO orders 
         (buyer_id, seller_id, advertisement_id, amount, status, payment_status, payment_method, payment_id, notes) 
         VALUES (?, ?, ?, ?, 'confirmed', 'completed', 'stripe', ?, ?)`,
        [userId, ad.seller_id, advertisementId, totalAmount, stripePaymentIntentId || 'mock_quick_buy', notesJson]
      );
      legacyOrderId = legacyOrderResult.insertId;

      // Create legacy order item
      await connection.execute(
        "INSERT INTO order_items (order_id, advertisement_id, quantity, price) VALUES (?, ?, 1, ?)",
        [legacyOrderId, advertisementId, itemPrice]
      );
    } catch (legacyErr) {
      console.error('Failed to create legacy order compatibility record:', legacyErr);
      // Do not roll back transaction, as quick order succeeded, but log it
    }

    // 7. Mark advertisement as sold
    await connection.execute(
      "UPDATE advertisements SET status = 'sold' WHERE id = ?",
      [advertisementId]
    );

    // 8. KYC earnings gate — update seller cumulative earnings
    await connection.execute(
      'UPDATE users SET cumulative_earnings = cumulative_earnings + ? WHERE id = ?',
      [itemPrice, ad.seller_id]
    );
    const [sellerKyc] = await connection.execute(
      'SELECT cumulative_earnings, kyc_required, kyc_completed FROM users WHERE id = ?',
      [ad.seller_id]
    );
    if (sellerKyc.length > 0) {
      const { cumulative_earnings, kyc_required, kyc_completed } = sellerKyc[0];
      if (cumulative_earnings >= 1000 && !kyc_required && !kyc_completed) {
        await connection.execute('UPDATE users SET kyc_required = 1 WHERE id = ?', [ad.seller_id]);
      }
    }

    await connection.commit();

    // 9. Send notifications (non-blocking)
    const cancelUntil = cancelWindowExpiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      // Notify buyer
      await createNotificationForUser({
        user_id: userId,
        type: 'popup',
        title: '✅ Purchase Complete!',
        message: `You bought "${ad.title}" for £${totalAmount.toFixed(2)}. You can cancel before ${cancelUntil}.`,
        action_data: { quick_order_id: quickOrderId, advertisement_id: advertisementId, action: 'purchase_complete' }
      });
      // Notify seller
      await createNotificationForUser({
        user_id: ad.seller_id,
        type: 'popup',
        title: '🎉 Item Sold!',
        message: `Your item "${ad.title}" was purchased for £${itemPrice.toFixed(2)}.`,
        action_data: { quick_order_id: quickOrderId, advertisement_id: advertisementId, action: 'item_sold' }
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({
      success: true,
      message: 'Purchase complete!',
      data: {
        quick_order_id: quickOrderId,
        item_title: ad.title,
        total_amount: totalAmount,
        cancellation_window_expires_at: cancelWindowExpiry,
        cancellation_window_minutes: cancelWindowMins,
        payment_intent_id: stripePaymentIntentId,
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Quick buy error:', error);
    res.status(500).json({ success: false, message: 'Server error during purchase' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * POST /api/v1/mobile-app/checkout/cancel/:orderId
 * Cancel a quick order within the cancellation window and issue Stripe refund.
 * Body: { reason?, reason_detail? }
 */
exports.cancelOrder = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason = 'changed_mind', reason_detail = '' } = req.body;

    // 1. Fetch and lock the order
    const [orders] = await connection.execute(
      `SELECT id, buyer_id, seller_id, advertisement_id, total_amount,
              stripe_payment_intent_id, order_status, payment_status,
              cancellation_window_expires_at
       FROM quick_orders WHERE id = ? FOR UPDATE`,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    if (order.buyer_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You can only cancel your own orders' });
    }

    if (order.order_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Order already cancelled' });
    }

    // 2. Check cancellation window
    const now = new Date();
    const windowExpiry = new Date(order.cancellation_window_expires_at);
    if (now > windowExpiry) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error_code: 'WINDOW_EXPIRED',
        message: 'The cancellation window has expired. Please contact support.'
      });
    }

    // 3. Stripe refund
    let stripeRefundId = null;
    let refundStatus = 'not_applicable';
    let refundAmount = parseFloat(order.total_amount);

    const [settingRows] = await connection.execute(
      "SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key'"
    );
    const stripeSecretKey = settingRows[0]?.setting_value || process.env.STRIPE_SECRET_KEY;

    if (stripeSecretKey && !stripeSecretKey.includes('dummy') && order.stripe_payment_intent_id) {
      try {
        const stripe = require('stripe')(stripeSecretKey);
        const refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          reason: 'requested_by_customer'
        });
        stripeRefundId = refund.id;
        refundStatus = refund.status === 'succeeded' ? 'succeeded' : 'pending';
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        refundStatus = 'failed';
        // Don't block cancellation record even if refund fails — support can handle manually
      }
    }

    // 4. Update order status
    await connection.execute(
      "UPDATE quick_orders SET order_status = 'cancelled', payment_status = 'refunded', updated_at = NOW() WHERE id = ?",
      [orderId]
    );

    // Also update legacy orders table status
    try {
      await connection.execute(
        "UPDATE orders SET status = 'cancelled', payment_status = 'refunded' WHERE advertisement_id = ? AND status NOT IN ('cancelled', 'refunded')",
        [order.advertisement_id]
      );
    } catch (legacyCancelErr) {
      console.error('Failed to update legacy order status on cancel:', legacyCancelErr);
    }

    // 5. Restore advertisement to published
    await connection.execute(
      "UPDATE advertisements SET status = 'published' WHERE id = ?",
      [order.advertisement_id]
    );

    // 6. Reverse KYC earnings
    await connection.execute(
      'UPDATE users SET cumulative_earnings = GREATEST(0, cumulative_earnings - ?) WHERE id = ?',
      [parseFloat(order.total_amount) - 0, order.seller_id] // use item_price ideally but total is safe fallback
    );

    // 7. Record cancellation
    await connection.execute(
      `INSERT INTO order_cancellations
       (quick_order_id, cancelled_by, reason, reason_detail, stripe_refund_id, refund_amount, refund_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, userId, reason, reason_detail, stripeRefundId, refundAmount, refundStatus]
    );

    await connection.commit();

    // 8. Notify buyer & seller (non-blocking)
    try {
      const [adRows] = await promisePool.execute('SELECT title FROM advertisements WHERE id = ?', [order.advertisement_id]);
      const adTitle = adRows[0]?.title || 'item';
      await createNotificationForUser({
        user_id: userId,
        type: 'popup',
        title: '↩️ Order Cancelled',
        message: `Your order for "${adTitle}" has been cancelled. Refund: £${refundAmount.toFixed(2)}.`,
        action_data: { quick_order_id: orderId, action: 'order_cancelled' }
      });
      await createNotificationForUser({
        user_id: order.seller_id,
        type: 'popup',
        title: 'Order Cancelled',
        message: `The buyer cancelled their order for "${adTitle}". The item is back on sale.`,
        action_data: { quick_order_id: orderId, action: 'order_cancelled_seller' }
      });
    } catch (notifErr) { console.error('Notification error:', notifErr); }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        quick_order_id: parseInt(orderId),
        refund_amount: refundAmount,
        refund_status: refundStatus,
        stripe_refund_id: stripeRefundId,
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error during cancellation' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * GET /api/v1/mobile-app/checkout/payment-methods
 * Returns all saved payment methods for the current user
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const [methods] = await promisePool.execute(
      `SELECT id, payment_method_type, provider, last_four, card_brand,
              expiry_month, expiry_year, is_default, created_at
       FROM saved_payment_methods
       WHERE user_id = ? AND is_active = 1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: { payment_methods: methods } });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/v1/mobile-app/checkout/payment-methods/:id/default
 * Set a saved payment method as the default
 */
exports.setDefaultPaymentMethod = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const [pmRows] = await connection.execute(
      'SELECT id FROM saved_payment_methods WHERE id = ? AND user_id = ? AND is_active = 1',
      [id, userId]
    );
    if (!pmRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // Clear existing default
    await connection.execute(
      'UPDATE saved_payment_methods SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
    // Set new default
    await connection.execute(
      'UPDATE saved_payment_methods SET is_default = 1 WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Default payment method updated' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Set default payment method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * DELETE /api/v1/mobile-app/checkout/payment-methods/:id
 * Soft-delete (deactivate) a saved payment method
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [result] = await promisePool.execute(
      'UPDATE saved_payment_methods SET is_active = 0 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/v1/mobile-app/quick-checkout/payment-methods
 * Save a payment method (either real Stripe or mock).
 */
exports.savePaymentMethod = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { paymentMethodId, lastFour, cardBrand, expiryMonth, expiryYear, isDefault = false } = req.body;

    if (!paymentMethodId) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'paymentMethodId is required' });
    }

    // Check if Stripe is configured and is not a dummy key
    const [settings] = await connection.execute(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('stripe_secret_key')"
    );
    const stripeSecretKey = settings[0]?.setting_value;

    let finalLastFour = lastFour || '0000';
    let finalCardBrand = cardBrand || 'card';
    let finalExpMonth = parseInt(expiryMonth) || 12;
    let finalExpYear = parseInt(expiryYear) || 99;

    const isMock = paymentMethodId.startsWith('pm_mock_') || !stripeSecretKey || stripeSecretKey.includes('dummy');

    if (!isMock) {
      try {
        const stripe = require('stripe')(stripeSecretKey);

        // Get user details
        const [userRows] = await connection.execute(
          'SELECT stripe_customer_id, email, full_name FROM users WHERE id = ?',
          [userId]
        );
        if (!userRows.length) {
          await connection.rollback();
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        let customerId = userRows[0].stripe_customer_id;

        // Create Stripe customer if they don't have one
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: userRows[0].email,
            name: userRows[0].full_name,
            metadata: { roundbuy_user_id: String(userId) }
          });
          customerId = customer.id;
          await connection.execute(
            'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
            [customerId, userId]
          );
        }

        // Attach PaymentMethod to Stripe customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        });

        // Retrieve card details to be absolutely sure of brand, last4, exp
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (pm && pm.card) {
          finalLastFour = pm.card.last4 || finalLastFour;
          finalCardBrand = pm.card.brand || finalCardBrand;
          finalExpMonth = pm.card.exp_month || finalExpMonth;
          finalExpYear = pm.card.exp_year || finalExpYear;
        }

        // If requested to be default, set on Stripe customer too
        if (isDefault) {
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId
            }
          });
        }
      } catch (stripeErr) {
        console.error('Stripe attach error:', stripeErr);
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: stripeErr.message || 'Stripe error attaching payment method'
        });
      }
    }

    // Check if this is the user's first payment method
    const [countRows] = await connection.execute(
      'SELECT COUNT(*) as cnt FROM saved_payment_methods WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    const isFirstCard = countRows[0].cnt === 0;

    // Determine default status: if it's the first card, force is_default = 1
    const shouldBeDefault = isDefault || isFirstCard;

    if (shouldBeDefault) {
      // Clear existing defaults
      await connection.execute(
        'UPDATE saved_payment_methods SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    // Insert into DB
    const [insertResult] = await connection.execute(
      `INSERT INTO saved_payment_methods
       (user_id, payment_method_type, provider, provider_payment_method_id, last_four, card_brand, expiry_month, expiry_year, is_default, is_active)
       VALUES (?, 'card', 'stripe', ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        paymentMethodId,
        finalLastFour,
        finalCardBrand,
        finalExpMonth,
        finalExpYear,
        shouldBeDefault ? 1 : 0
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Payment method saved successfully',
      data: {
        id: insertResult.insertId,
        last_four: finalLastFour,
        card_brand: finalCardBrand,
        expiry_month: finalExpMonth,
        expiry_year: finalExpYear,
        is_default: shouldBeDefault ? 1 : 0
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Save payment method error:', error);
    res.status(500).json({ success: false, message: 'Server error saving payment method' });
  } finally {
    if (connection) connection.release();
  }
};
