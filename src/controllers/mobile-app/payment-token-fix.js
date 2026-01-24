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
 * Create Payment Method (Using Stripe Tokens API - No raw card data setting required)
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
            param: error.param
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment method',
            error_code: 'PAYMENT_METHOD_ERROR'
        });
    }
};

module.exports = {
    createPaymentMethod
};
