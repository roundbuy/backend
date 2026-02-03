const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes require admin or editor role
router.use(authenticate);
router.use(authorize('admin', 'editor'));

// ==================== DASHBOARD ====================
router.get('/dashboard', adminController.getDashboardStats);

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', authorize('admin'), adminController.deleteUser); // Only admin can delete

// ==================== SUBSCRIPTION PLANS ====================
router.get('/subscription-plans', adminController.getSubscriptionPlans);
router.post('/subscription-plans', adminController.createSubscriptionPlan);
router.put('/subscription-plans/:id', adminController.updateSubscriptionPlan);
router.delete('/subscription-plans/:id', authorize('admin'), adminController.deleteSubscriptionPlan);

// ==================== ADVERTISEMENT PLANS ====================
const advertisementPlansRoutes = require('./admin/advertisement-plans.admin.routes');
router.use('/advertisement-plans', advertisementPlansRoutes);

// ==================== BANNER PLANS ====================
const bannerPlansRoutes = require('./admin/banner-plans.admin.routes');
router.use('/banner-plans', bannerPlansRoutes);

// ==================== ADVERTISEMENTS (Content Management) ====================
router.get('/advertisements', adminController.getAdvertisements);
router.get('/advertisements/:id', adminController.getAdvertisementDetail);
router.put('/advertisements/:id', adminController.updateAdvertisement);
router.patch('/advertisements/:id/approve', adminController.approveAdvertisement);
router.patch('/advertisements/:id/reject', adminController.rejectAdvertisement);
router.delete('/advertisements/:id', adminController.deleteAdvertisement);

// ==================== BANNERS (Content Management) ====================
router.get('/banners', adminController.getBanners);
router.patch('/banners/:id/approve', adminController.approveBanner);
router.patch('/banners/:id/reject', adminController.rejectBanner);
router.delete('/banners/:id', adminController.deleteBanner);

// ==================== SUBSCRIPTIONS ====================
router.get('/subscriptions', adminController.getSubscriptions);
router.put('/subscriptions/:id', adminController.updateSubscription);

// ==================== LANGUAGES ====================
router.get('/languages', adminController.getLanguages);
router.post('/languages', adminController.createLanguage);
router.put('/languages/:id', adminController.updateLanguage);
router.delete('/languages/:id', authorize('admin'), adminController.deleteLanguage);

// ==================== TRANSLATIONS ====================
router.get('/translation-keys', adminController.getTranslationKeys);
router.post('/translation-keys', adminController.createTranslationKey);
router.get('/translations', adminController.getTranslations);
router.put('/translations/:id', adminController.updateTranslation);

// ==================== SETTINGS ====================
router.get('/settings', adminController.getSettings);
router.put('/settings/:setting_key', adminController.updateSetting);
router.post('/settings/bulk', adminController.bulkUpdateSettings);

// ==================== MODERATION ====================
router.get('/moderation/words', adminController.getModerationWords);
router.post('/moderation/words', adminController.createModerationWord);
router.put('/moderation/words/:id', adminController.updateModerationWord);
router.delete('/moderation/words/:id', adminController.deleteModerationWord);

router.get('/moderation/queue', adminController.getModerationQueue);
router.patch('/moderation/queue/:id/review', adminController.reviewModerationItem);

// ==================== API LOGS ====================
router.get('/api-logs', adminController.getAPILogs);
router.get('/api-logs/:id', adminController.getAPILogDetail);

// ==================== CATEGORIES ====================
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', authorize('admin'), adminController.deleteCategory);

// ==================== AD ACTIVITIES ====================
router.get('/ad-activities', adminController.getAdActivities);
router.post('/ad-activities', adminController.createAdActivity);
router.put('/ad-activities/:id', adminController.updateAdActivity);
router.delete('/ad-activities/:id', authorize('admin'), adminController.deleteAdActivity);

// ==================== AD CONDITIONS ====================
router.get('/ad-conditions', adminController.getAdConditions);
router.post('/ad-conditions', adminController.createAdCondition);
router.put('/ad-conditions/:id', adminController.updateAdCondition);
router.delete('/ad-conditions/:id', authorize('admin'), adminController.deleteAdCondition);

// ==================== AD AGES ====================
router.get('/ad-ages', adminController.getAdAges);
router.post('/ad-ages', adminController.createAdAge);
router.put('/ad-ages/:id', adminController.updateAdAge);
router.delete('/ad-ages/:id', authorize('admin'), adminController.deleteAdAge);

// ==================== AD GENDERS ====================
router.get('/ad-genders', adminController.getAdGenders);
router.post('/ad-genders', adminController.createAdGender);
router.put('/ad-genders/:id', adminController.updateAdGender);
router.delete('/ad-genders/:id', authorize('admin'), adminController.deleteAdGender);

// ==================== AD SIZES ====================
router.get('/ad-sizes', adminController.getAdSizes);
router.post('/ad-sizes', adminController.createAdSize);
router.put('/ad-sizes/:id', adminController.updateAdSize);
router.delete('/ad-sizes/:id', authorize('admin'), adminController.deleteAdSize);

// ==================== AD COLORS ====================
router.get('/ad-colors', adminController.getAdColors);
router.post('/ad-colors', adminController.createAdColor);
router.put('/ad-colors/:id', adminController.updateAdColor);
router.delete('/ad-colors/:id', authorize('admin'), adminController.deleteAdColor);

// ==================== CURRENCIES ====================
router.get('/currencies', adminController.getCurrencies);
router.post('/currencies', adminController.createCurrency);
router.put('/currencies/:id', adminController.updateCurrency);
router.delete('/currencies/:id', authorize('admin'), adminController.deleteCurrency);

// ==================== COUNTRIES ====================
router.get('/countries', adminController.getCountries);
router.post('/countries', adminController.createCountry);
router.put('/countries/:id', adminController.updateCountry);
router.delete('/countries/:id', authorize('admin'), adminController.deleteCountry);

// ==================== FAQs ====================
// ==================== FAQs ====================
const faqRoutes = require('./admin/faq.admin.routes');
router.use('/faqs', faqRoutes);

// ==================== WALLET & FINANCE ====================
const walletRoutes = require('./admin/wallet.admin.routes');
router.use('/wallets', walletRoutes);

// ==================== SUGGESTIONS ====================
const suggestionsController = require('../controllers/mobile-app/suggestions.controller');
router.get('/suggestions', suggestionsController.getSuggestions);

module.exports = router;