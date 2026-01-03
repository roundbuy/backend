/**
 * Admin role checking middleware
 * Verifies that the authenticated user has the required admin role
 */

const checkAdminRole = (allowedRoles = []) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        // Check if user has role property
        if (!req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - no role assigned',
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - insufficient permissions',
            });
        }

        // User has required role, proceed
        next();
    };
};

/**
 * Permission-based access control
 * More granular than role-based
 */
const checkPermission = (requiredPermission) => {
    const rolePermissions = {
        super_admin: ['*'], // All permissions
        admin: [
            'view_issues',
            'manage_issues',
            'view_disputes',
            'manage_disputes',
            'view_claims',
            'manage_claims',
            'view_tickets',
            'manage_tickets',
            'view_users',
            'manage_users',
            'view_analytics',
            'manage_settings',
        ],
        support_staff: [
            'view_issues',
            'view_disputes',
            'view_tickets',
            'respond_tickets',
            'view_users',
        ],
        moderator: [
            'view_issues',
            'view_disputes',
            'view_tickets',
            'view_users',
        ],
    };

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        const userRole = req.user.role;
        const permissions = rolePermissions[userRole] || [];

        // Super admin has all permissions
        if (permissions.includes('*')) {
            return next();
        }

        // Check if user has required permission
        if (!permissions.includes(requiredPermission)) {
            return res.status(403).json({
                success: false,
                message: `Access denied - missing permission: ${requiredPermission}`,
            });
        }

        next();
    };
};

/**
 * Log admin actions for audit trail
 */
const logAdminAction = async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to log after response
    res.send = function (data) {
        // Only log successful actions (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Log to database (async, don't wait)
            logAction(req).catch(err => console.error('Failed to log admin action:', err));
        }

        // Call original send
        originalSend.call(this, data);
    };

    next();
};

/**
 * Helper function to log action to database
 */
async function logAction(req) {
    try {
        const { promisePool } = require('../config/database');

        const actionType = `${req.method} ${req.path}`;
        const targetType = extractTargetType(req.path);
        const targetId = extractTargetId(req.path);

        await promisePool.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.userId,
                actionType,
                targetType,
                targetId,
                JSON.stringify({
                    method: req.method,
                    path: req.path,
                    body: req.body,
                    query: req.query,
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                }),
            ]
        );
    } catch (error) {
        console.error('Log action error:', error);
    }
}

/**
 * Extract target type from path
 */
function extractTargetType(path) {
    if (path.includes('/issues')) return 'issue';
    if (path.includes('/disputes')) return 'dispute';
    if (path.includes('/claims')) return 'claim';
    if (path.includes('/tickets')) return 'ticket';
    if (path.includes('/users')) return 'user';
    return 'unknown';
}

/**
 * Extract target ID from path
 */
function extractTargetId(path) {
    const match = path.match(/\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

module.exports = {
    checkAdminRole,
    checkPermission,
    logAdminAction,
};
