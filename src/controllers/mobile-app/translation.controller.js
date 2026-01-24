const { promisePool } = require('../../config/database');

/**
 * Get all translations for a specific language
 * GET /api/v1/mobile-app/translations?language=en
 * 
 * Returns translations as key-value pairs for easy use in mobile app
 * Example: { "auth.login": "Login", "auth.register": "Register", ... }
 */
const getTranslations = async (req, res) => {
    try {
        const { language = 'en' } = req.query;

        // Get language ID
        const [languages] = await promisePool.query(
            'SELECT id, code, name FROM languages WHERE code = ? AND is_active = TRUE',
            [language]
        );

        if (languages.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Language '${language}' not found or inactive`
            });
        }

        const languageId = languages[0].id;

        // Get all translations for this language
        const [translations] = await promisePool.query(`
      SELECT 
        tk.key_name,
        tk.category,
        COALESCE(t.translated_text, tk.default_text) as text,
        t.is_auto_translated
      FROM translation_keys tk
      LEFT JOIN translations t ON tk.id = t.translation_key_id AND t.language_id = ?
      ORDER BY tk.category, tk.key_name
    `, [languageId]);

        // Convert to key-value pairs
        const translationsMap = {};
        translations.forEach(row => {
            translationsMap[row.key_name] = row.text;
        });

        // Also provide categorized version
        const categorized = {};
        translations.forEach(row => {
            if (!categorized[row.category]) {
                categorized[row.category] = {};
            }
            categorized[row.category][row.key_name] = row.text;
        });

        res.json({
            success: true,
            data: {
                language: {
                    code: languages[0].code,
                    name: languages[0].name
                },
                translations: translationsMap,
                categorized: categorized,
                total: translations.length
            }
        });
    } catch (error) {
        console.error('Get translations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching translations',
            error: error.message
        });
    }
};

/**
 * Get translations by category for a specific language
 * GET /api/v1/mobile-app/translations/:category?language=en
 * 
 * Returns translations for a specific category (e.g., auth, products, chat)
 */
const getTranslationsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { language = 'en' } = req.query;

        // Get language ID
        const [languages] = await promisePool.query(
            'SELECT id, code, name FROM languages WHERE code = ? AND is_active = TRUE',
            [language]
        );

        if (languages.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Language '${language}' not found or inactive`
            });
        }

        const languageId = languages[0].id;

        // Get translations for this category
        const [translations] = await promisePool.query(`
      SELECT 
        tk.key_name,
        tk.category,
        tk.default_text,
        COALESCE(t.translated_text, tk.default_text) as text,
        t.is_auto_translated
      FROM translation_keys tk
      LEFT JOIN translations t ON tk.id = t.translation_key_id AND t.language_id = ?
      WHERE tk.category = ?
      ORDER BY tk.key_name
    `, [languageId, category]);

        if (translations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No translations found for category '${category}'`
            });
        }

        // Convert to key-value pairs
        const translationsMap = {};
        translations.forEach(row => {
            translationsMap[row.key_name] = row.text;
        });

        res.json({
            success: true,
            data: {
                language: {
                    code: languages[0].code,
                    name: languages[0].name
                },
                category: category,
                translations: translationsMap,
                total: translations.length
            }
        });
    } catch (error) {
        console.error('Get translations by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching translations',
            error: error.message
        });
    }
};

/**
 * Update user's language preference
 * PUT /api/v1/mobile-app/user/language
 * 
 * Body: { language_code: "hi" }
 */
const updateUserLanguage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { language_code } = req.body;

        if (!language_code) {
            return res.status(400).json({
                success: false,
                message: 'Language code is required'
            });
        }

        // Verify language exists and is active
        const [languages] = await promisePool.query(
            'SELECT id, code, name FROM languages WHERE code = ? AND is_active = TRUE',
            [language_code]
        );

        if (languages.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Language '${language_code}' not found or inactive`
            });
        }

        const languageId = languages[0].id;

        // Update user's language preference
        await promisePool.query(
            'UPDATE users SET preferred_language_id = ? WHERE id = ?',
            [languageId, userId]
        );

        res.json({
            success: true,
            message: 'Language preference updated successfully',
            data: {
                language: {
                    id: languageId,
                    code: languages[0].code,
                    name: languages[0].name
                }
            }
        });
    } catch (error) {
        console.error('Update user language error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating language preference',
            error: error.message
        });
    }
};

/**
 * Get available languages
 * GET /api/v1/mobile-app/languages
 * 
 * Returns list of all active languages
 */
const getAvailableLanguages = async (req, res) => {
    try {
        const [languages] = await promisePool.query(`
      SELECT 
        id,
        code,
        name,
        is_default
      FROM languages
      WHERE is_active = TRUE
      ORDER BY is_default DESC, name ASC
    `);

        res.json({
            success: true,
            data: languages
        });
    } catch (error) {
        console.error('Get available languages error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching languages',
            error: error.message
        });
    }
};

/**
 * Get user's current language preference
 * GET /api/v1/mobile-app/user/language
 */
const getUserLanguage = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await promisePool.query(`
      SELECT 
        u.preferred_language_id,
        l.code,
        l.name,
        l.native_name,
        l.is_rtl
      FROM users u
      LEFT JOIN languages l ON u.preferred_language_id = l.id
      WHERE u.id = ?
    `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // If user has no language preference, return default language
        if (!user.preferred_language_id) {
            const [defaultLang] = await promisePool.query(
                'SELECT id, code, name, native_name, is_rtl FROM languages WHERE is_default = TRUE LIMIT 1'
            );

            if (defaultLang.length > 0) {
                return res.json({
                    success: true,
                    data: {
                        language: defaultLang[0],
                        is_default: true
                    }
                });
            }
        }

        res.json({
            success: true,
            data: {
                language: {
                    id: user.preferred_language_id,
                    code: user.code,
                    name: user.name,
                    native_name: user.native_name,
                    is_rtl: user.is_rtl
                },
                is_default: false
            }
        });
    } catch (error) {
        console.error('Get user language error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user language',
            error: error.message
        });
    }
};

/**
 * Get translation statistics
 * GET /api/v1/mobile-app/translations/stats
 */
const getTranslationStats = async (req, res) => {
    try {
        // Get total keys
        const [totalKeys] = await promisePool.query(
            'SELECT COUNT(*) as count FROM translation_keys'
        );

        // Get translations per language
        const [perLanguage] = await promisePool.query(`
      SELECT 
        l.code,
        l.name,
        COUNT(t.id) as translation_count,
        SUM(CASE WHEN t.is_auto_translated = TRUE THEN 1 ELSE 0 END) as auto_translated_count
      FROM languages l
      LEFT JOIN translations t ON l.id = t.language_id
      WHERE l.is_active = TRUE
      GROUP BY l.id, l.code, l.name
      ORDER BY l.name
    `);

        // Get translations per category
        const [perCategory] = await promisePool.query(`
      SELECT 
        category,
        COUNT(*) as key_count
      FROM translation_keys
      GROUP BY category
      ORDER BY key_count DESC
    `);

        res.json({
            success: true,
            data: {
                total_keys: totalKeys[0].count,
                languages: perLanguage,
                categories: perCategory
            }
        });
    } catch (error) {
        console.error('Get translation stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching translation statistics',
            error: error.message
        });
    }
};

module.exports = {
    getTranslations,
    getTranslationsByCategory,
    updateUserLanguage,
    getAvailableLanguages,
    getUserLanguage,
    getTranslationStats
};
