const { verifyAccessToken } = require('../utils/jwt');
const { promisePool } = require('../config/database');

/**
 * Authenticate user middleware
 */
const authenticate = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token in header');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length);

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
      console.log('✅ Token verified, userId:', decoded.userId);
    } catch (tokenError) {
      console.log('❌ Token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Get user from database
    const [users] = await promisePool.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    console.log('Database query result, users found:', users.length);

    if (users.length === 0) {
      console.log('❌ User not found in database, userId:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role, is_active: user.is_active });

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account is deactivated');
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = user;
    console.log('✅ Auth successful, user:', user.id, user.email);
    next();
  } catch (error) {
    console.log('❌ Unexpected error in auth middleware:', error.message);
    console.log('Error stack:', error.stack);
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('=== AUTHORIZE MIDDLEWARE ===');
    console.log('Required roles:', roles);
    console.log('User present:', !!req.user);
    console.log('User role:', req.user?.role);

    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ User role not in required roles');
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    console.log('✅ Authorization successful');
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      const [users] = await promisePool.query(
        'SELECT id, email, full_name, role, is_active FROM users WHERE id = ? AND is_active = true',
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }

    next();
  } catch (error) {
    // Continue without user authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};