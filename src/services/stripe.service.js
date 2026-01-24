const { promisePool } = require('../config/database');

/**
 * Stripe Service - Reusable service for managing Stripe products and prices
 * Handles all Stripe API operations with proper error handling and logging
 */

/**
 * Get Stripe instance with configured key from database
 * @returns {Promise<Stripe>} Initialized Stripe instance
 * @throws {Error} If Stripe secret key is not configured
 */
const getStripeInstance = async () => {
    try {
        const [settings] = await promisePool.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key' LIMIT 1"
        );

        if (settings.length === 0 || !settings[0].setting_value) {
            throw new Error('Stripe secret key not configured in database settings');
        }

        return require('stripe')(settings[0].setting_value);
    } catch (error) {
        console.error('❌ Error getting Stripe instance:', error.message);
        throw error;
    }
};

/**
 * Create a new Stripe Product
 * @param {string} name - Product name
 * @param {string} description - Product description
 * @param {Object} metadata - Additional metadata to store with product
 * @returns {Promise<Object>} Created Stripe Product object
 */
const createProduct = async (name, description = '', metadata = {}) => {
    try {
        console.log(`📦 Creating Stripe Product: ${name}`);
        const stripe = await getStripeInstance();

        const product = await stripe.products.create({
            name,
            description,
            metadata: {
                ...metadata,
                created_at: new Date().toISOString()
            }
        });

        console.log(`✅ Product created: ${product.id}`);
        return product;
    } catch (error) {
        console.error(`❌ Error creating Stripe Product "${name}":`, error.message);
        throw new Error(`Failed to create Stripe Product: ${error.message}`);
    }
};

/**
 * Update an existing Stripe Product
 * @param {string} productId - Stripe Product ID
 * @param {Object} data - Data to update (name, description, metadata, active)
 * @returns {Promise<Object>} Updated Stripe Product object
 */
const updateProduct = async (productId, data = {}) => {
    try {
        console.log(`📝 Updating Stripe Product: ${productId}`);
        const stripe = await getStripeInstance();

        const updateData = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.metadata) {
            updateData.metadata = {
                ...data.metadata,
                updated_at: new Date().toISOString()
            };
        }
        if (data.active !== undefined) updateData.active = data.active;

        const product = await stripe.products.update(productId, updateData);

        console.log(`✅ Product updated: ${productId}`);
        return product;
    } catch (error) {
        console.error(`❌ Error updating Stripe Product ${productId}:`, error.message);
        throw new Error(`Failed to update Stripe Product: ${error.message}`);
    }
};

/**
 * Create a new Stripe Price for a product
 * @param {string} productId - Stripe Product ID
 * @param {number} amount - Price amount (in dollars/euros, will be converted to cents)
 * @param {string} currency - Currency code (USD, EUR, INR, etc.)
 * @param {string} interval - Billing interval: 'one_time', 'day', 'week', 'month', 'year'
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created Stripe Price object
 */
const createPrice = async (productId, amount, currency, interval = 'one_time', metadata = {}) => {
    try {
        console.log(`💰 Creating Stripe Price: ${amount} ${currency.toUpperCase()} for ${productId}`);
        const stripe = await getStripeInstance();

        const priceData = {
            product: productId,
            unit_amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            metadata: {
                ...metadata,
                created_at: new Date().toISOString()
            }
        };

        // Add recurring configuration if not one-time
        if (interval !== 'one_time') {
            priceData.recurring = {
                interval: interval
            };
        }

        const price = await stripe.prices.create(priceData);

        console.log(`✅ Price created: ${price.id}`);
        return price;
    } catch (error) {
        console.error(`❌ Error creating Stripe Price for ${productId}:`, error.message);
        throw new Error(`Failed to create Stripe Price: ${error.message}`);
    }
};

/**
 * Archive (deactivate) a Stripe Price
 * Note: Stripe Prices cannot be deleted, only archived
 * @param {string} priceId - Stripe Price ID to archive
 * @returns {Promise<Object>} Updated Stripe Price object
 */
const archivePrice = async (priceId) => {
    try {
        if (!priceId) {
            console.warn('⚠️ No price ID provided to archive');
            return null;
        }

        console.log(`🗄️ Archiving Stripe Price: ${priceId}`);
        const stripe = await getStripeInstance();

        const price = await stripe.prices.update(priceId, {
            active: false,
            metadata: {
                archived_at: new Date().toISOString()
            }
        });

        console.log(`✅ Price archived: ${priceId}`);
        return price;
    } catch (error) {
        console.error(`❌ Error archiving Stripe Price ${priceId}:`, error.message);
        throw new Error(`Failed to archive Stripe Price: ${error.message}`);
    }
};

/**
 * Get a Stripe Product by ID
 * @param {string} productId - Stripe Product ID
 * @returns {Promise<Object>} Stripe Product object
 */
const getProduct = async (productId) => {
    try {
        console.log(`🔍 Fetching Stripe Product: ${productId}`);
        const stripe = await getStripeInstance();

        const product = await stripe.products.retrieve(productId);

        console.log(`✅ Product retrieved: ${product.id}`);
        return product;
    } catch (error) {
        console.error(`❌ Error fetching Stripe Product ${productId}:`, error.message);
        throw new Error(`Failed to get Stripe Product: ${error.message}`);
    }
};

/**
 * List all prices for a specific product
 * @param {string} productId - Stripe Product ID
 * @param {boolean} activeOnly - Only return active prices (default: false)
 * @returns {Promise<Array>} Array of Stripe Price objects
 */
const listPrices = async (productId, activeOnly = false) => {
    try {
        console.log(`📋 Listing prices for product: ${productId}`);
        const stripe = await getStripeInstance();

        const params = { product: productId, limit: 100 };
        if (activeOnly) {
            params.active = true;
        }

        const prices = await stripe.prices.list(params);

        console.log(`✅ Found ${prices.data.length} prices for ${productId}`);
        return prices.data;
    } catch (error) {
        console.error(`❌ Error listing prices for ${productId}:`, error.message);
        throw new Error(`Failed to list Stripe Prices: ${error.message}`);
    }
};

/**
 * Archive a Stripe Product (sets active to false)
 * @param {string} productId - Stripe Product ID
 * @returns {Promise<Object>} Updated Stripe Product object
 */
const archiveProduct = async (productId) => {
    try {
        if (!productId) {
            console.warn('⚠️ No product ID provided to archive');
            return null;
        }

        console.log(`🗄️ Archiving Stripe Product: ${productId}`);
        const stripe = await getStripeInstance();

        const product = await stripe.products.update(productId, {
            active: false,
            metadata: {
                archived_at: new Date().toISOString()
            }
        });

        console.log(`✅ Product archived: ${productId}`);
        return product;
    } catch (error) {
        console.error(`❌ Error archiving Stripe Product ${productId}:`, error.message);
        throw new Error(`Failed to archive Stripe Product: ${error.message}`);
    }
};

// ============ Legacy/Helper Functions ============

/**
 * Create or update Stripe Product (legacy function for backward compatibility)
 * @deprecated Use createProduct() and updateProduct() instead
 */
const syncStripeProduct = async (planData, existingProductId = null) => {
    try {
        const metadata = {
            plan_type: planData.plan_type,
            plan_id: planData.id?.toString(),
            slug: planData.slug
        };

        if (existingProductId) {
            return (await updateProduct(existingProductId, {
                name: planData.name,
                description: planData.description,
                metadata
            })).id;
        } else {
            return (await createProduct(
                planData.name,
                planData.description || '',
                metadata
            )).id;
        }
    } catch (error) {
        console.error('❌ Error syncing Stripe Product:', error.message);
        throw error;
    }
};

/**
 * Create Stripe Price (legacy function for backward compatibility)
 * @deprecated Use createPrice() instead
 */
const createStripePrice = async (productId, amount, currency, metadata = {}) => {
    try {
        const price = await createPrice(productId, amount, currency, 'one_time', metadata);
        return price.id;
    } catch (error) {
        console.error('❌ Error creating Stripe Price:', error.message);
        throw error;
    }
};

/**
 * Deactivate Stripe Price (legacy function for backward compatibility)
 * @deprecated Use archivePrice() instead
 */
const deactivateStripePrice = async (priceId) => {
    try {
        await archivePrice(priceId);
    } catch (error) {
        console.error('❌ Error deactivating Stripe Price:', error.message);
        throw error;
    }
};

/**
 * Archive Stripe Product (legacy function for backward compatibility)
 * @deprecated Use archiveProduct() instead
 */
const archiveStripeProduct = async (productId) => {
    try {
        await archiveProduct(productId);
    } catch (error) {
        console.error('❌ Error archiving Stripe Product:', error.message);
        throw error;
    }
};

module.exports = {
    // Core functions
    getStripeInstance,
    createProduct,
    updateProduct,
    createPrice,
    archivePrice,
    getProduct,
    listPrices,
    archiveProduct,

    // Legacy functions (for backward compatibility)
    syncStripeProduct,
    createStripePrice,
    deactivateStripePrice,
    archiveStripeProduct
};
