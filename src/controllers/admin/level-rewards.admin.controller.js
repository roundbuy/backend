/**
 * Admin Level Rewards Controller
 * 
 * Handles admin operations for managing level rewards (Green, Gold, etc.).
 * Requires admin authentication.
 */

const { promisePool: db } = require('../../config/database');

/**
 * Get all level rewards
 * GET /api/v1/admin/level-rewards
 */
exports.getAllLevelRewards = async (req, res) => {
    try {
        const [rewards] = await db.execute(
            `SELECT * FROM reward_categories 
             WHERE type = 'level_reward' 
             ORDER BY required_referrals ASC`
        );

        res.json({
            success: true,
            data: rewards,
            count: rewards.length
        });
    } catch (error) {
        console.error('Get all level rewards error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch level rewards'
        });
    }
};

/**
 * Create a new level reward
 * POST /api/v1/admin/level-rewards
 */
exports.createLevelReward = async (req, res) => {
    try {
        const {
            name,
            description,
            points_cost,
            level_classification: required_level,
            required_referrals,
            is_active
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO reward_categories 
             (name, description, type, points_cost, required_level, required_referrals, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                'level_reward', // hardcoded type since this is specifically for level rewards
                points_cost || 0,
                required_level || 'beginner',
                required_referrals || 0,
                is_active !== false // default to true
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Level reward created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Create level reward error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create level reward'
        });
    }
};

/**
 * Update a level reward
 * PUT /api/v1/admin/level-rewards/:id
 */
exports.updateLevelReward = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            points_cost,
            level_classification: required_level,
            required_referrals,
            is_active
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const [result] = await db.execute(
            `UPDATE reward_categories 
             SET name = ?, description = ?, points_cost = ?, required_level = ?, 
                 required_referrals = ?, is_active = ?
             WHERE id = ? AND type = 'level_reward'`,
            [
                name,
                description || null,
                points_cost || 0,
                required_level || 'beginner',
                required_referrals || 0,
                is_active !== false,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Level reward not found'
            });
        }

        res.json({
            success: true,
            message: 'Level reward updated successfully'
        });
    } catch (error) {
        console.error('Update level reward error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update level reward'
        });
    }
};

/**
 * Delete a level reward
 * DELETE /api/v1/admin/level-rewards/:id
 */
exports.deleteLevelReward = async (req, res) => {
    try {
        const { id } = req.params;

        // Optionally, we could check if users already claimed this reward, but since usually it's tied to their current step, we'll just allow deletion or rely on `is_active` for soft-delete in practice.
        const [result] = await db.execute(
            `DELETE FROM reward_categories WHERE id = ? AND type = 'level_reward'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Level reward not found'
            });
        }

        res.json({
            success: true,
            message: 'Level reward deleted successfully'
        });
    } catch (error) {
        console.error('Delete level reward error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete level reward'
        });
    }
};
