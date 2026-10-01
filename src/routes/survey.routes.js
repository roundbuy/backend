const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/survey.controller');
const { verifyAccessToken } = require('../utils/jwt');

// Optional authentication middleware
const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = verifyAccessToken(token);
            req.user = { id: decoded.userId };
        } catch (e) {
            // Fail silently for optional auth
        }
    }
    next();
};

router.post('/nps', optionalAuthenticate, surveyController.submitNps);
router.post('/beta-feedback', optionalAuthenticate, surveyController.submitBetaFeedback);

module.exports = router;
