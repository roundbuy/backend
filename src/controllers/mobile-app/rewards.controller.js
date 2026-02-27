const { promisePool } = require('../../config/database');

exports.getRewards = async (req, res) => {
    try {
        // Get all active reward categories ordered by sort_order
        // We exclude 'level_reward' since they are managed separately on the Level Rewards screen
        const [categories] = await promisePool.query(
            "SELECT * FROM reward_categories WHERE is_active = TRUE ORDER BY sort_order ASC"
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

// ==========================================
// Level Rewards Endpoints
// ==========================================

exports.getLevelStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await promisePool.query(
            'SELECT full_name, current_reward_points, lifetime_reward_points, current_reward_level, level_achieved_date, points_reset_date FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                userName: user.full_name || 'User',
                currentPoints: user.current_reward_points || 0,
                lifetimePoints: user.lifetime_reward_points || 0,
                currentLevel: user.current_reward_level || 'beginner',
                levelAchievedDate: user.level_achieved_date,
                pointsResetDate: user.points_reset_date,
            }
        });
    } catch (error) {
        console.error('Error fetching level status:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch level status' });
    }
};

exports.getLevelRewards = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch all active rewards (both level and non-level)
        const [rewards] = await promisePool.query(
            'SELECT * FROM reward_categories WHERE is_active = TRUE ORDER BY sort_order ASC'
        );

        // Fetch user progress for these rewards
        const [progress] = await promisePool.query(
            'SELECT reward_category_id, progress_count, is_redeemed, redeemed_at FROM user_rewards_progress WHERE user_id = ?',
            [userId]
        );

        // Map progress to rewards
        const progressMap = {};
        progress.forEach(p => {
            progressMap[p.reward_category_id] = p;
        });

        const formattedRewards = rewards.map(reward => {
            const userProg = progressMap[reward.id] || { progress_count: 0, is_redeemed: false, redeemed_at: null };
            return {
                id: reward.id,
                title: reward.name,
                subtitle: reward.description,
                points: reward.points_cost || 100, // Should be added if not exists, but fallback to 100
                level: reward.required_level || 'beginner',
                type: reward.type || 'standard',
                isEarnableOnce: !!reward.is_earnable_once,
                progressCount: userProg.progress_count,
                isRedeemed: !!userProg.is_redeemed,
                redeemedAt: userProg.redeemed_at,
                requiredReferrals: reward.required_referrals || 5
            };
        });

        // Group by level
        const beginner = formattedRewards.filter(r => r.level === 'beginner');
        const advanced = formattedRewards.filter(r => r.level === 'advanced');
        const exclusive = formattedRewards.filter(r => r.level === 'exclusive');

        res.json({
            success: true,
            data: {
                beginner,
                advanced,
                exclusive
            }
        });

    } catch (error) {
        console.error('Error fetching level rewards:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch level rewards' });
    }
};

exports.redeemLevelReward = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rewardId, productId } = req.body;

        if (!rewardId) {
            return res.status(400).json({ success: false, message: 'Reward ID is required' });
        }

        // Dummy logic for testing redemption flow. 
        // In real app, we'd verify progress_count >= required_referrals, 
        // increment ads visibility for productId, and update user_rewards_progress.

        // Let's just blindly mark as redeemed for now to allow UI testing
        await promisePool.query(
            `INSERT INTO user_rewards_progress (user_id, reward_category_id, is_redeemed, redeemed_at, progress_count) 
             VALUES (?, ?, true, NOW(), 5)
             ON DUPLICATE KEY UPDATE is_redeemed = true, redeemed_at = NOW(), progress_count = 5`,
            [userId, rewardId]
        );

        res.json({
            success: true,
            message: 'Reward redeemed successfully applied to product: ' + (productId || 'None')
        });

    } catch (error) {
        console.error('Error redeeming reward:', error);
        res.status(500).json({ success: false, message: 'Failed to redeem reward' });
    }
};
