const { promisePool } = require('../config/database');

/**
 * Check if text contains any moderated words
 * @param {string} text - Text to check
 * @returns {Promise<{isClean: boolean, foundWords: Array, severity: string}>}
 */
async function checkTextModeration(text) {
    try {
        if (!text || typeof text !== 'string') {
            return { isClean: true, foundWords: [], severity: null };
        }

        // Get all active moderation words
        const [moderationWords] = await promisePool.query(
            'SELECT word, category, severity FROM moderation_words WHERE is_active = 1'
        );

        console.log(`[MODERATION] Checking text: "${text}"`);
        console.log(`[MODERATION] Active moderation words count: ${moderationWords.length}`);
        if (moderationWords.length > 0) {
            console.log(`[MODERATION] Active words:`, moderationWords.map(w => w.word).join(', '));
        }

        if (moderationWords.length === 0) {
            console.log('[MODERATION] No active moderation words found in database');
            return { isClean: true, foundWords: [], severity: null };
        }

        const foundWords = [];
        const textLower = text.toLowerCase();

        // Check each moderation word
        for (const moderationWord of moderationWords) {
            const wordLower = moderationWord.word.toLowerCase();

            // Check for whole word match using word boundaries
            const regex = new RegExp(`\\b${wordLower}\\b`, 'i');
            if (regex.test(textLower)) {
                console.log(`[MODERATION] ⚠️  Found violation: "${moderationWord.word}" in text`);
                foundWords.push({
                    word: moderationWord.word,
                    category: moderationWord.category,
                    severity: moderationWord.severity
                });
            }
        }

        if (foundWords.length === 0) {
            console.log('[MODERATION] ✅ No violations found - content is clean');
            return { isClean: true, foundWords: [], severity: null };
        }

        console.log(`[MODERATION] ❌ Content blocked - found ${foundWords.length} violation(s)`);

        // Determine the highest severity
        const severities = foundWords.map(w => w.severity);
        const highestSeverity = severities.includes('high') ? 'high' :
            severities.includes('medium') ? 'medium' : 'low';

        return {
            isClean: false,
            foundWords: foundWords,
            severity: highestSeverity
        };
    } catch (error) {
        console.error('Text moderation check error:', error);
        // In case of error, allow the content to pass
        return { isClean: true, foundWords: [], severity: null };
    }
}

/**
 * Check multiple text fields for moderation
 * @param {Object} fields - Object with field names as keys and text as values
 * @returns {Promise<{isClean: boolean, violations: Object}>}
 */
async function checkMultipleFields(fields) {
    try {
        const violations = {};
        let hasViolations = false;

        for (const [fieldName, text] of Object.entries(fields)) {
            if (text) {
                const result = await checkTextModeration(text);
                if (!result.isClean) {
                    violations[fieldName] = result;
                    hasViolations = true;
                }
            }
        }

        return {
            isClean: !hasViolations,
            violations: violations
        };
    } catch (error) {
        console.error('Multiple fields moderation check error:', error);
        return { isClean: true, violations: {} };
    }
}

module.exports = {
    checkTextModeration,
    checkMultipleFields
};
