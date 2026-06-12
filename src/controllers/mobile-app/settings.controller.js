const { promisePool } = require('../../config/database');

/**
 * Get available languages
 * GET /api/v1/mobile-app/settings/languages
 */
exports.getLanguages = async (req, res) => {
  try {
    const [languages] = await promisePool.query(
      'SELECT id, name, code, flag_icon, is_default FROM languages WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );
    res.json({ success: true, data: { languages } });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching languages', error: error.message });
  }
};

/**
 * Get available currencies
 * GET /api/v1/mobile-app/settings/currencies
 */
exports.getCurrencies = async (req, res) => {
  try {
    const [currencies] = await promisePool.query(
      'SELECT id, code, name, symbol, exchange_rate, is_default FROM currencies WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );
    res.json({ success: true, data: { currencies } });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ success: false, message: 'Error fetching currencies', error: error.message });
  }
};

/**
 * Get available countries
 * GET /api/v1/mobile-app/settings/countries
 */
exports.getCountries = async (req, res) => {
  try {
    const [countries] = await promisePool.query(
      'SELECT id, name, code, iso_code, phone_code, currency_code, flag_emoji, is_default FROM countries WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );
    res.json({ success: true, data: { countries } });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ success: false, message: 'Error fetching countries', error: error.message });
  }
};

/**
 * Update user preferences (language, country, currency)
 * PUT /api/v1/mobile-app/settings/preferences
 */
exports.updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language_preference, country_code, currency_code } = req.body;
    const updates = [];
    const params = [];

    if (language_preference) { updates.push('language_preference = ?'); params.push(language_preference); }
    if (country_code) { updates.push('country_code = ?'); params.push(country_code); }
    if (currency_code) { updates.push('currency_code = ?'); params.push(currency_code); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No preferences to update' });
    }

    params.push(userId);
    await promisePool.query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);

    const [users] = await promisePool.query(
      'SELECT id, full_name, email, language_preference, country_code, currency_code FROM users WHERE id = ?',
      [userId]
    );
    res.json({ success: true, message: 'Preferences updated successfully', data: { user: users[0] } });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ success: false, message: 'Error updating preferences', error: error.message });
  }
};

/**
 * Get user preferences
 * GET /api/v1/mobile-app/settings/preferences
 */
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await promisePool.query(
      `SELECT u.language_preference, u.country_code, u.currency_code,
              l.name as language_name, c.name as country_name, cur.name as currency_name, cur.symbol as currency_symbol
       FROM users u
       LEFT JOIN languages l ON u.language_preference = l.code
       LEFT JOIN countries c ON u.country_code = c.code
       LEFT JOIN currencies cur ON u.currency_code = cur.code
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { preferences: users[0] } });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ success: false, message: 'Error fetching preferences', error: error.message });
  }
};

/**
 * Get offer rules (min offer percentage + tooltip text)
 * GET /api/v1/mobile-app/settings/offer-rules
 * Public — no auth required (used before user places an offer)
 */
exports.getOfferRules = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT setting_key, setting_value
       FROM settings
       WHERE category = 'offers'
         AND setting_key IN ('min_offer_percentage', 'min_offer_tooltip_text')`
    );

    // Safe defaults in case the DB row is missing
    const rules = {
      min_offer_percentage: 60,
      min_offer_tooltip_text:
        'Offers lower than 60% of the asking price are not possible, to reflect items true value.'
    };

    rows.forEach((row) => {
      if (row.setting_key === 'min_offer_percentage') {
        rules.min_offer_percentage = parseFloat(row.setting_value) || 60;
      }
      if (row.setting_key === 'min_offer_tooltip_text') {
        let txt = row.setting_value || '';
        // Strip surrounding quotes if the value was stored as a JSON string literal
        if (txt.startsWith('"') && txt.endsWith('"')) {
          try { txt = JSON.parse(txt); } catch (_) { /* keep as-is */ }
        }
        rules.min_offer_tooltip_text = txt;
      }
    });

    res.json({ success: true, data: rules });
  } catch (error) {
    console.error('Get offer rules error:', error);
    // Always return safe defaults so the frontend never breaks
    res.json({
      success: true,
      data: {
        min_offer_percentage: 60,
        min_offer_tooltip_text:
          'Offers lower than 60% of the asking price are not possible, to reflect items true value.'
      }
    });
  }
};

/**
 * Update offer rules (admin only)
 * PUT /api/v1/mobile-app/settings/offer-rules
 */
exports.updateOfferRules = async (req, res) => {
  try {
    const { min_offer_percentage, min_offer_tooltip_text } = req.body;

    if (min_offer_percentage === undefined && min_offer_tooltip_text === undefined) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const updates = [];

    if (min_offer_percentage !== undefined) {
      const pct = parseFloat(min_offer_percentage);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        return res.status(400).json({
          success: false,
          message: 'min_offer_percentage must be a number between 1 and 100'
        });
      }
      updates.push(
        promisePool.query(
          `INSERT INTO settings (category, setting_key, setting_value)
           VALUES ('offers', 'min_offer_percentage', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [String(pct)]
        )
      );
    }

    if (min_offer_tooltip_text !== undefined) {
      updates.push(
        promisePool.query(
          `INSERT INTO settings (category, setting_key, setting_value)
           VALUES ('offers', 'min_offer_tooltip_text', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [min_offer_tooltip_text]
        )
      );
    }

    await Promise.all(updates);
    res.json({ success: true, message: 'Offer rules updated successfully' });
  } catch (error) {
    console.error('Update offer rules error:', error);
    res.status(500).json({ success: false, message: 'Error updating offer rules', error: error.message });
  }
};