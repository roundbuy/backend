
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

        // Fetch metrics with user details + computed seller_score
        // Seller Score formula (KPI guide: weight by impact):
        //   30% Successful Sales Rate
        //   25% Fast Reply Rate (within 2h)
        //   25% Response Time (inverted — lower is better, normalised to 100)
        //   10% Dispute Resolution Rate
        //   10% Pickup/Meeting Attendance Rate
        const searchQuery = req.query.search
            ? `AND (u.full_name LIKE ? OR u.email LIKE ?)`
            : '';
        const searchParams = req.query.search
            ? [`%${req.query.search}%`, `%${req.query.search}%`]
            : [];

        const [rows] = await promisePool.query(
            `SELECT 
                sm.*,
                u.full_name, u.email, u.profile_image, u.average_rating, u.total_feedbacks,
                ROUND(
                    (sm.successful_sales_rate * 0.30) +
                    (sm.questions_answered_within_2h_rate * 0.25) +
                    (GREATEST(0, 100 - LEAST(sm.avg_response_time_minutes, 100)) * 0.25) +
                    (sm.dispute_resolution_rate * 0.10) +
                    (sm.pickup_meeting_attendance_rate * 0.10)
                , 1) as seller_score
             FROM seller_metrics sm
             JOIN users u ON sm.user_id = u.id
             ${searchQuery}
             ORDER BY seller_score DESC
             LIMIT ? OFFSET ?`,
            [...searchParams, limit, offset]
        );

        // Get total count for pagination
        const countWhere = req.query.search
            ? `WHERE (u.full_name LIKE ? OR u.email LIKE ?)`
            : '';
        const [countResult] = await promisePool.query(
            `SELECT COUNT(*) as total FROM seller_metrics sm JOIN users u ON sm.user_id = u.id ${countWhere}`,
            searchParams
        );
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

/**
 * GET /seller-metrics/me
 * Authenticated seller views their own KPI dashboard
 */
exports.getMySellerMetrics = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { promisePool } = require('../config/database');

        const [rows] = await promisePool.query(
            `SELECT 
                sm.*,
                u.full_name, u.email, u.profile_image, u.average_rating, u.total_feedbacks,
                ROUND(
                    (sm.successful_sales_rate * 0.30) +
                    (sm.questions_answered_within_2h_rate * 0.25) +
                    (GREATEST(0, 100 - LEAST(sm.avg_response_time_minutes, 100)) * 0.25) +
                    (sm.dispute_resolution_rate * 0.10) +
                    (sm.pickup_meeting_attendance_rate * 0.10)
                , 1) as seller_score,
                (SELECT COUNT(id) FROM orders WHERE seller_id = sm.user_id AND status IN ('confirmed','shipped','delivered','completed')) as completed_orders,
                (SELECT COUNT(id) FROM orders WHERE seller_id = sm.user_id AND status IN ('cancelled','refunded')) as cancelled_orders,
                (SELECT COUNT(id) FROM orders WHERE seller_id = sm.user_id) as total_orders
             FROM seller_metrics sm
             JOIN users u ON sm.user_id = u.id
             WHERE sm.user_id = ?`,
            [sellerId]
        );

        if (!rows || rows.length === 0) {
            // Try to compute fresh metrics
            const SellerMetricsService = require('../services/SellerMetricsService');
            const fresh = await SellerMetricsService.updateMetrics(sellerId);
            return res.json({ success: true, data: fresh });
        }

        const metrics = rows[0];

        // Compute tips based on weakest KPI
        const tips = [];
        if (metrics.successful_sales_rate < 70) {
            tips.push({ key: 'sales', message: 'Improve your sales rate by responding to offers quickly and keeping prices competitive.' });
        }
        if (metrics.questions_answered_within_2h_rate < 75) {
            tips.push({ key: 'reply', message: 'Reply to buyer questions within 2 hours to boost your fast reply score.' });
        }
        if (metrics.avg_response_time_minutes > 60) {
            tips.push({ key: 'response', message: 'Your average response time is high. Enable notifications so you never miss a message.' });
        }
        if (metrics.dispute_resolution_rate < 80) {
            tips.push({ key: 'disputes', message: 'Resolve disputes promptly through the Resolution Centre to protect your score.' });
        }
        if (metrics.pickup_meeting_attendance_rate < 80) {
            tips.push({ key: 'pickup', message: 'Missing pickup meetings hurts your score. Only accept meetups you can commit to.' });
        }

        res.json({
            success: true,
            data: { ...metrics, tips }
        });
    } catch (error) {
        console.error('Error fetching seller own metrics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your performance metrics' });
    }
};
