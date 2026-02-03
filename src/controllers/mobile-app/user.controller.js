const { promisePool } = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage for profile images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads/profiles');
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + extension);
    }
});

// File filter for image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG and PNG images are allowed.`), false);
    }
};

// Configure multer upload for single profile image
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
    }
}).single('profile_image'); // Field name 'profile_image'

/**
 * Upload/Update profile image
 * POST /api/v1/mobile-app/user/profile-image
 */
const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;

        // Use multer upload middleware
        upload(req, res, async (err) => {
            if (err) {
                // Handle multer errors
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            success: false,
                            message: 'File size too large. Maximum size is 5MB.'
                        });
                    }
                }

                // Handle custom file filter errors
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error'
                });
            }

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            // Get base URL from request
            const protocol = req.protocol;
            const host = req.get('host');
            const baseUrl = `${protocol}://${host}`;

            // Generate full URL for uploaded image
            const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

            // Get user's current profile image to delete old one
            const [users] = await promisePool.query(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );

            const oldProfileImage = users[0]?.avatar;

            // Update user's profile image in database
            await promisePool.query(
                'UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?',
                [imageUrl, userId]
            );

            // Delete old profile image file if it exists and is not a default image
            if (oldProfileImage && oldProfileImage.includes('/uploads/profiles/')) {
                try {
                    const oldFilename = path.basename(oldProfileImage);
                    const oldFilePath = path.join(__dirname, '../../../uploads/profiles', oldFilename);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (deleteError) {
                    console.error('Error deleting old profile image:', deleteError);
                    // Continue anyway, don't fail the request
                }
            }

            res.status(200).json({
                success: true,
                message: 'Profile image updated successfully',
                data: {
                    profile_image: imageUrl,
                    filename: req.file.filename,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile image',
            error: error.message
        });
    }
};

/**
 * Get user profile
 * GET /api/v1/mobile-app/user/profile
 */
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await promisePool.query(
            `SELECT id, email, full_name, phone, avatar, country_code, 
               created_at, updated_at, last_username_change, username, referral_code
        FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Map avatar to profile_image for frontend compatibility
        const user = users[0];
        const userResponse = {
            ...user,
            profile_image: user.avatar
        };

        res.json({
            success: true,
            data: {
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

/**
 * Update user profile
 * PUT /api/v1/mobile-app/user/profile
 */
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone, country_code } = req.body;

        // Build dynamic update query
        const updates = [];
        const params = [];

        if (full_name !== undefined) {
            updates.push('full_name = ?');
            params.push(full_name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (country_code !== undefined) {
            updates.push('country_code = ?');
            params.push(country_code);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Update user profile
        params.push(userId);
        await promisePool.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            params
        );

        // Get updated user profile
        const [users] = await promisePool.query(
            `SELECT id, email, full_name, phone, avatar, country_code,
              created_at, updated_at, last_username_change, username, referral_code
       FROM users WHERE id = ?`,
            [userId]
        );

        // Map avatar to profile_image for frontend compatibility
        const user = users[0];
        const userResponse = {
            ...user,
            profile_image: user.avatar
        };

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user profile',
            error: error.message
        });
    }
};

/**
 * Verify user credentials for access rights confirmation
 * POST /api/v1/mobile-app/user/verify-credentials
 */
const verifyCredentials = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get user by email
        const [users] = await promisePool.query(
            'SELECT id, email, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Verify password (assuming bcrypt is used)
        const bcrypt = require('bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        res.json({
            success: true,
            message: 'Credentials verified successfully',
            data: {
                userId: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Verify credentials error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying credentials',
            error: error.message
        });
    }
};

/**
 * Send verification code to email
 * POST /api/v1/mobile-app/user/send-verification-code
 */
const sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Generate 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        // Store code in database with expiration (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await promisePool.query(
            `INSERT INTO verification_codes (email, code, expires_at, created_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE code = ?, expires_at = ?, created_at = NOW()`,
            [email, code, expiresAt, code, expiresAt]
        );

        // TODO: Send email with verification code
        // For now, we'll just return success
        // In production, integrate with email service (SendGrid, AWS SES, etc.)
        console.log(`Verification code for ${email}: ${code}`);

        res.json({
            success: true,
            message: 'Verification code sent to your email',
            // Remove this in production - only for testing
            data: {
                code: process.env.NODE_ENV === 'development' ? code : undefined
            }
        });
    } catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification code',
            error: error.message
        });
    }
};

/**
 * Verify email code
 * POST /api/v1/mobile-app/user/verify-code
 */
const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and code are required'
            });
        }

        // Get verification code from database
        const [codes] = await promisePool.query(
            `SELECT code, expires_at FROM verification_codes 
             WHERE email = ? AND code = ? AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [email, code]
        );

        if (codes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        // Delete used code
        await promisePool.query(
            'DELETE FROM verification_codes WHERE email = ? AND code = ?',
            [email, code]
        );

        res.json({
            success: true,
            message: 'Code verified successfully',
            data: {
                verified: true
            }
        });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying code',
            error: error.message
        });
    }
};

/**
 * Submit data request
 * POST /api/v1/mobile-app/user/data-request
 */
const submitDataRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestType, reason, additionalInfo } = req.body;

        if (!requestType || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Request type and reason are required'
            });
        }

        // Validate request type
        const validTypes = ['deletion', 'download', 'delete_data', 'delete_account'];
        if (!validTypes.includes(requestType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request type'
            });
        }

        // Generate unique request ID
        const { v4: uuidv4 } = require('uuid');
        const requestId = uuidv4();

        // Insert data request
        await promisePool.query(
            `INSERT INTO data_requests 
             (id, user_id, request_type, reason, additional_info, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [requestId, userId, requestType, reason, additionalInfo || null]
        );

        // TODO: Send email notification to user
        // TODO: Send notification to admin

        res.status(201).json({
            success: true,
            message: 'Data request submitted successfully',
            data: {
                requestId,
                requestType,
                status: 'pending',
                estimatedProcessingDays: '7-14'
            }
        });
    } catch (error) {
        console.error('Submit data request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting data request',
            error: error.message
        });
    }
};

/**
 * Get user's data requests
 * GET /api/v1/mobile-app/user/data-requests
 */
const getDataRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const [requests] = await promisePool.query(
            `SELECT id, request_type, reason, additional_info, status, 
                    admin_notes, created_at, processed_at
             FROM data_requests
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                requests
            }
        });
    } catch (error) {
        console.error('Get data requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching data requests',
            error: error.message
        });
    }
};

/**
 * Get specific data request
 * GET /api/v1/mobile-app/user/data-request/:id
 */
const getDataRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const requestId = req.params.id;

        const [requests] = await promisePool.query(
            `SELECT id, request_type, reason, additional_info, status,
                    admin_notes, created_at, processed_at, processed_by
             FROM data_requests
             WHERE id = ? AND user_id = ?`,
            [requestId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data request not found'
            });
        }

        res.json({
            success: true,
            data: {
                request: requests[0]
            }
        });
    } catch (error) {
        console.error('Get data request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching data request',
            error: error.message
        });
    }
};

/**
 * Check username availability
 * POST /api/v1/mobile-app/user/check-username
 */
const checkUsernameAvailability = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Validate username format
        const usernameRegex = /^[a-z0-9][a-z0-9_-]*$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username format. Must start with lowercase letter or number, and can only contain lowercase letters, numbers, hyphens, and underscores.'
            });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 50 characters'
            });
        }

        // Check if username exists
        const [users] = await promisePool.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        const available = users.length === 0;

        res.json({
            success: true,
            data: {
                username,
                available
            }
        });
    } catch (error) {
        console.error('Check username availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking username availability',
            error: error.message
        });
    }
};

/**
 * Update username
 * PUT /api/v1/mobile-app/user/username
 */
const updateUsername = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Validate username format
        const usernameRegex = /^[a-z0-9][a-z0-9_-]*$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username format. Must start with lowercase letter or number, and can only contain lowercase letters, numbers, hyphens, and underscores.'
            });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 50 characters'
            });
        }

        // Check if username is already taken by another user
        const [existingUsers] = await promisePool.query(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, userId]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username is already taken'
            });
        }

        // Check if user has changed username recently (within 31 days)
        const [userCheck] = await promisePool.query(
            'SELECT last_username_change FROM users WHERE id = ?',
            [userId]
        );

        if (userCheck.length > 0 && userCheck[0].last_username_change) {
            const lastChange = new Date(userCheck[0].last_username_change);
            const now = new Date();
            const timeDiff = now - lastChange;
            const daysDiff = timeDiff / (1000 * 3600 * 24); // Difference in days (float)

            if (daysDiff < 31) {
                const daysRemaining = Math.ceil(31 - daysDiff);
                // Calculate next available date
                const nextDate = new Date(lastChange);
                nextDate.setDate(lastChange.getDate() + 31);

                return res.status(400).json({
                    success: false,
                    message: `You can change your username again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
                    data: {
                        nextAvailableDate: nextDate
                    }
                });
            }
        }

        // Update username and last_username_change
        await promisePool.query(
            'UPDATE users SET username = ?, last_username_change = NOW() WHERE id = ?',
            [username, userId]
        );

        // Get updated user
        const [users] = await promisePool.query(
            'SELECT id, email, username, last_username_change FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Username updated successfully',
            data: {
                user: users[0]
            }
        });
    } catch (error) {
        console.error('Update username error:', error);

        // Handle duplicate key error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Username is already taken'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating username',
            error: error.message
        });
    }
};

module.exports = {
    updateProfileImage,
    getUserProfile,
    updateUserProfile,
    verifyCredentials,
    sendVerificationCode,
    verifyCode,
    submitDataRequest,
    getDataRequests,
    getDataRequest,
    checkUsernameAvailability,
    updateUsername
};
