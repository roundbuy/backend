const { promisePool } = require('../../config/database');

exports.getRewards = async (req, res) => {
    try {
        // Get all active reward categories ordered by sort_order
        const [categories] = await promisePool.query(
            'SELECT * FROM reward_categories WHERE is_active = TRUE ORDER BY sort_order ASC'
        );

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rewards'
        });
    }
};

exports.getReferrals = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's referral code
        const [user] = await promisePool.query(
            'SELECT referral_code FROM users WHERE id = ?',
            [userId]
        );

        const referralCode = user[0]?.referral_code;

        // Get list of referrals
        const [referrals] = await promisePool.query(
            `SELECT r.id, r.status, u.full_name as username, r.created_at
       FROM referrals r
       JOIN users u ON r.referee_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                referralCode,
                referrals: referrals.map(ref => ({
                    id: ref.id,
                    username: ref.username,
                    status: ref.status,
                    date: ref.created_at
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching referrals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch referrals'
        });
    }
};

exports.generateReferralCode = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user already has a code
        const [existing] = await promisePool.query(
            'SELECT referral_code FROM users WHERE id = ?',
            [userId]
        );

        if (existing[0]?.referral_code) {
            return res.json({
                success: true,
                referralCode: existing[0].referral_code
            });
        }

        // Generate unique code (Simple implementation: RB + Random 6 chars)
        const code = 'RB' + Math.random().toString(36).substring(2, 8).toUpperCase();

        await promisePool.query(
            'UPDATE users SET referral_code = ? WHERE id = ?',
            [code, userId]
        );

        res.json({
            success: true,
            referralCode: code
        });

    } catch (error) {
        console.error('Error generating referral code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate referral code'
        });
    }
};

exports.getLotteryInfo = async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Get winners from previous month/all time
        const [winners] = await promisePool.query(
            `SELECT lw.*, u.full_name as username 
       FROM lottery_winners lw
       JOIN users u ON lw.user_id = u.id
       ORDER BY lw.year DESC, lw.month DESC
       LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                winners: winners.map(w => ({
                    id: w.id,
                    username: w.username,
                    amount: w.amount,
                    month: w.month,
                    year: w.year
                })),
                jackpot: 100.00 // Static for now as per design
            }
        });

    } catch (error) {
        console.error('Error fetching lottery info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lottery info'
        });
    }
};

exports.getPopularSearches = async (req, res) => {
    try {
        const [searches] = await promisePool.query(
            'SELECT * FROM popular_searches ORDER BY search_count DESC LIMIT 10'
        );

        res.json({
            success: true,
            data: searches
        });
    } catch (error) {
        console.error('Error fetching popular searches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch popular searches'
        });
    }
};

exports.validateReferralCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Referral code is required'
            });
        }

        const [referrer] = await promisePool.query(
            'SELECT id, full_name FROM users WHERE referral_code = ?',
            [code]
        );

        if (referrer.length === 0) {
            return res.json({
                success: false,
                isValid: false,
                message: 'Invalid referral code'
            });
        }

        res.json({
            success: true,
            isValid: true,
            referrerName: referrer[0].full_name
        });

    } catch (error) {
        console.error('Error validating referral code:', error);
        res.status(500).json({
            success: false,
            message: 'Validation failed'
        });
    }
};
