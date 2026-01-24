const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiter for demo endpoints
const demoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (1 per second)
  message: 'Too many demo requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/demo', demoLimiter); // Apply lenient limiter to demo routes
app.use('/api/', limiter); // Apply strict limiter to other routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version
const API_VERSION = process.env.API_VERSION || 'v1';

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const advertisementRoutes = require('./routes/advertisement.routes');
const bannerRoutes = require('./routes/banner.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const orderRoutes = require('./routes/order.routes');
const messageRoutes = require('./routes/message.routes');
const languageRoutes = require('./routes/language.routes');
const adminRoutes = require('./routes/admin.routes');
const faqRoutes = require('./routes/faq.routes');

// Mobile app routes
const mobileAuthRoutes = require('./routes/mobile-app/auth.routes');
const mobileUserRoutes = require('./routes/mobile-app/user.routes');
const mobileSubscriptionRoutes = require('./routes/mobile-app/subscription.routes');
const mobilePromotionRoutes = require('./routes/mobile-app/promotion.routes');
const mobileAdvertisementRoutes = require('./routes/mobile-app/advertisement.routes');
const mobileLocationRoutes = require('./routes/mobile-app/location.routes');
const mobileSettingsRoutes = require('./routes/mobile-app/settings.routes');
const mobileUploadRoutes = require('./routes/mobile-app/upload.routes');
const mobileMessagingRoutes = require('./routes/mobile-app/messaging.routes');
const mobileFavoritesRoutes = require('./routes/mobile-app/favorites.routes');
const mobileOffersRoutes = require('./routes/mobile-app/offers.routes');
const mobileDisputeRoutes = require('./routes/mobile-app/dispute.routes');
const mobileIssueRoutes = require('./routes/mobile-app/issue.routes');
const mobileClaimRoutes = require('./routes/mobile-app/claim.routes');
const mobileSupportRoutes = require('./routes/mobile-app/support.routes');
const mobileSupportResolutionRoutes = require('./routes/mobile-app/supportResolutionRoutes');
const mobilePaddleRoutes = require('./routes/mobile-app/paddle.routes');
const mobileFaqRoutes = require('./routes/mobile-app/faq.routes');
const mobileTranslationRoutes = require('./routes/mobile-app/translation.routes');
const mobileModerationRoutes = require('./routes/mobile-app/moderation.routes');
const mobileFeedbackRoutes = require('./routes/feedbackRoutes');
const mobilePickupRoutes = require('./routes/pickupRoutes');
const mobileColorsRoutes = require('./routes/mobile-app/colors.routes');
const mobileWalletRoutes = require('./routes/mobile-app/wallet.routes');
const demoRoutes = require('./routes/demo.routes');


// Admin routes
const adminResolutionRoutes = require('./routes/admin/resolution.admin.routes');
const adminNotificationRoutes = require('./routes/admin/notificationRoutes');
const adminMessagingRoutes = require('./routes/admin/messaging.admin.routes');

// Mobile notification routes
const mobileNotificationRoutes = require('./routes/mobile-app/notificationRoutes');

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/advertisements`, advertisementRoutes);
app.use(`/api/${API_VERSION}/banners`, bannerRoutes);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
app.use(`/api/${API_VERSION}/orders`, orderRoutes);
app.use(`/api/${API_VERSION}/messages`, messageRoutes);
app.use(`/api/${API_VERSION}/languages`, languageRoutes);
app.use(`/api/${API_VERSION}/faqs`, faqRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);


// Mobile app routes
app.use(`/api/${API_VERSION}/mobile-app/auth`, mobileAuthRoutes);
app.use(`/api/${API_VERSION}/mobile-app/user`, mobileUserRoutes);
app.use(`/api/${API_VERSION}/mobile-app/subscription`, mobileSubscriptionRoutes);
app.use(`/api/${API_VERSION}/mobile-app/promotions`, mobilePromotionRoutes);
app.use(`/api/${API_VERSION}/mobile-app/advertisements`, mobileAdvertisementRoutes);
app.use(`/api/${API_VERSION}/mobile-app/locations`, mobileLocationRoutes);
app.use(`/api/${API_VERSION}/mobile-app/settings`, mobileSettingsRoutes);
app.use(`/api/${API_VERSION}/mobile-app/upload`, mobileUploadRoutes);
app.use(`/api/${API_VERSION}/mobile-app/messaging`, mobileMessagingRoutes);
app.use(`/api/${API_VERSION}/mobile-app/favorites`, mobileFavoritesRoutes);
app.use(`/api/${API_VERSION}/mobile-app/offers`, mobileOffersRoutes);
app.use(`/api/${API_VERSION}/mobile-app/disputes`, mobileDisputeRoutes);
app.use(`/api/${API_VERSION}/mobile-app/issues`, mobileIssueRoutes);
app.use(`/api/${API_VERSION}/mobile-app/claims`, mobileClaimRoutes);
app.use(`/api/${API_VERSION}/mobile-app/support`, mobileSupportRoutes);
app.use(`/api/${API_VERSION}/mobile-app`, mobileSupportResolutionRoutes);
app.use(`/api/${API_VERSION}/mobile-app/paddle`, mobilePaddleRoutes);
app.use(`/api/${API_VERSION}/mobile-app/faqs`, mobileFaqRoutes);
app.use(`/api/${API_VERSION}/mobile-app/translations`, mobileTranslationRoutes);
app.use(`/api/${API_VERSION}/mobile-app/moderation`, mobileModerationRoutes);
app.use(`/api/${API_VERSION}/mobile-app/feedbacks`, mobileFeedbackRoutes);
app.use(`/api/${API_VERSION}/mobile-app/pickups`, mobilePickupRoutes);
app.use(`/api/${API_VERSION}/mobile-app/colors`, mobileColorsRoutes);
app.use(`/api/${API_VERSION}/mobile-app/wallet`, mobileWalletRoutes);



// Admin routes
app.use(`/api/${API_VERSION}/admin/resolution`, adminResolutionRoutes);
app.use(`/api/${API_VERSION}/admin/notifications`, adminNotificationRoutes);
app.use(`/api/${API_VERSION}/admin/messaging`, adminMessagingRoutes);

// Mobile notification routes (under /mobile-app for consistency)
app.use(`/api/${API_VERSION}/mobile-app/notifications`, mobileNotificationRoutes);

// Demo routes (public, no auth required)
app.use(`/api/${API_VERSION}/demo`, demoRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;