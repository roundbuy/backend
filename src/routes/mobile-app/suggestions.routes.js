const express = require('express');
const router = express.Router();
const suggestionsController = require('../../controllers/mobile-app/suggestions.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Apply optional auth middleware if we want to capture user ID but allow anonymous suggestions
// Or strict auth if only logged-in users can suggest. 
// Given the "give feedback from almost every page" requirement, it might include non-logged in pages.
// But mostly the app requires login. Let's assume we can use the `optionalAuth` if it exists, or just `authMiddleware` if strict.
// For now, I'll use standard authMiddleware as most app features require login. 
// If specific pages are public, we might need a looser middleware.
// Let's check if there is a 'optionalAuth' middleware later. For now, we'll try to use authMiddleware but handle the error or use a wrapper if needed.
// Actually, looking at `rewards.controller.js`, it accesses `req.user.id`.
// Let's stick to authMiddleware for now as the user flow likely happens after login.

router.post('/submit', authenticate, suggestionsController.submitSuggestion);

module.exports = router;
