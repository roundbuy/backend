
const SellerMetricsService = require('../services/SellerMetricsService');

exports.getSellerMetrics = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // In a real scenario, we might want to trigger an update if data is stale (e.g., > 24h old)
        // For now, we fetch, and if distinct lack of data, maybe trigger update?
        // Let's trigger update on read for now to ensure freshness during demo, 
        // but in prod usually a cron job does this.

        // Check if metrics exist
        let metrics = await SellerMetricsService.getMetrics(sellerId);

        if (!metrics) {
            // First time calculation
            metrics = await SellerMetricsService.updateMetrics(sellerId);
        } else {
            // Maybe check timestamp?
            const now = new Date();
            const updated = new Date(metrics.updated_at);
            const diffHours = (now - updated) / 36e5;
            if (diffHours > 1) { // Update every hour
                metrics = await SellerMetricsService.updateMetrics(sellerId);
            }
        }

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Error fetching seller metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller metrics'
        });
    }
};

exports.getAllSellerMetrics = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { promisePool } = require('../config/database');

        // Fetch metrics with user details
        const [rows] = await promisePool.query(
            `SELECT sm.*, u.full_name, u.email, u.profile_image 
             FROM seller_metrics sm
             JOIN users u ON sm.user_id = u.id
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // Get total count for pagination
        const [countResult] = await promisePool.query('SELECT COUNT(*) as total FROM seller_metrics');
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching all seller metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller metrics'
        });
    }
};
