const geoip = require('geoip-lite');
const { promisePool } = require('../config/database');

/**
 * Checks if an IP address is a private/local network IP.
 * @param {string} ip - IP address to test
 * @returns {boolean} True if IP is local/private
 */
function isLocalIp(ip) {
  if (!ip) return true;
  const cleanIp = ip.trim();
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('172.16.') ||
    cleanIp.startsWith('172.17.') ||
    cleanIp.startsWith('172.18.') ||
    cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.20.') ||
    cleanIp.startsWith('172.21.') ||
    cleanIp.startsWith('172.22.') ||
    cleanIp.startsWith('172.23.') ||
    cleanIp.startsWith('172.24.') ||
    cleanIp.startsWith('172.25.') ||
    cleanIp.startsWith('172.26.') ||
    cleanIp.startsWith('172.27.') ||
    cleanIp.startsWith('172.28.') ||
    cleanIp.startsWith('172.29.') ||
    cleanIp.startsWith('172.30.') ||
    cleanIp.startsWith('172.31.') ||
    cleanIp.startsWith('::ffff:127.0.0.1') ||
    cleanIp.startsWith('::ffff:10.') ||
    cleanIp.startsWith('::ffff:192.168.')
  );
}

/**
 * Automatically detects the user's country of origin and sets it in the DB.
 * Follows the 24-hour rate limit rule and only runs if the preference was auto-detected or is null.
 * 
 * @param {number} userId - ID of the logged-in user
 * @param {string} ipAddress - Client IP address
 * @param {Object} currentUserData - Current user preferences from database
 * @returns {Promise<string>} The detected or existing preferred country
 */
async function autoDetectUserCountry(userId, ipAddress, currentUserData) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Rule check: Only auto-detect if the preference was auto-detected (or null/never set),
    // AND it has been more than 24 hours since the last auto-detection attempt.
    const isAutoPreference = currentUserData.country_auto_detected === 1 || currentUserData.country_auto_detected === null;
    const isThrottled = currentUserData.last_country_detection_at && new Date(currentUserData.last_country_detection_at) > oneDayAgo;

    if (!isAutoPreference || isThrottled) {
      console.log(`[CountryDetector] Skipping detection. manual_preference=${!isAutoPreference}, throttled=${isThrottled}`);
      return currentUserData.preferred_country || 'International';
    }

    console.log(`[CountryDetector] Performing IP lookup for IP: ${ipAddress}`);
    let detectedCountry = 'International';

    if (ipAddress && !isLocalIp(ipAddress)) {
      const lookup = geoip.lookup(ipAddress);
      if (lookup && lookup.country) {
        const code = lookup.country.toUpperCase();
        if (code === 'GB' || code === 'UK') {
          detectedCountry = 'UK';
        } else if (code === 'US') {
          detectedCountry = 'USA';
        } else if (code === 'FR') {
          detectedCountry = 'FR';
        } else if (code === 'IT') {
          detectedCountry = 'IT';
        } else if (code === 'JP') {
          detectedCountry = 'JP';
        }
      }
    } else {
      console.log('[CountryDetector] Local or empty IP. Defaulting auto-detected country to fallback.');
      // In local dev, we don't want to constantly update 'International' if they already have a value.
      // We will use their existing preference or fallback to 'International'.
      detectedCountry = currentUserData.preferred_country || 'International';
    }

    console.log(`[CountryDetector] Auto-detected country: ${detectedCountry} (previous: ${currentUserData.preferred_country})`);

    // Update database (sets country_auto_detected to 1 since this is automatic)
    await promisePool.query(
      `UPDATE users 
       SET preferred_country = ?, 
           country_auto_detected = 1, 
           last_country_detection_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [detectedCountry, userId]
    );

    return detectedCountry;
  } catch (error) {
    console.error('[CountryDetector] Error in autoDetectUserCountry:', error);
    return currentUserData.preferred_country || 'International';
  }
}

module.exports = {
  autoDetectUserCountry,
  isLocalIp
};
