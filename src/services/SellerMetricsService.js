
const { promisePool: db } = require('../config/database');

class SellerMetricsService {
    /**
     * Calculate and update metrics for a specific seller
     * @param {number} userId - The seller's user ID
     */
    static async updateMetrics(userId) {
        try {
            const [
                responseTimeStats,
                pickupStats,
                questionsStats,
                salesStats,
                disputeStats
            ] = await Promise.all([
                this.calculateResponseTime(userId),
                this.calculatePickupRate(userId),
                this.calculateQuestionsAnsweredRate(userId),
                this.calculateSalesRate(userId),
                this.calculateDisputeResolutionRate(userId)
            ]);

            await db.query(
                `INSERT INTO seller_metrics 
        (user_id, avg_response_time_minutes, pickup_meeting_attendance_rate, questions_answered_within_2h_rate, successful_sales_rate, dispute_resolution_rate)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        avg_response_time_minutes = VALUES(avg_response_time_minutes),
        pickup_meeting_attendance_rate = VALUES(pickup_meeting_attendance_rate),
        questions_answered_within_2h_rate = VALUES(questions_answered_within_2h_rate),
        successful_sales_rate = VALUES(successful_sales_rate),
        dispute_resolution_rate = VALUES(dispute_resolution_rate)`,
                [
                    userId,
                    responseTimeStats,
                    pickupStats,
                    questionsStats,
                    salesStats,
                    disputeStats
                ]
            );

            return {
                userId,
                avgResponseTimeMinutes: responseTimeStats,
                pickupRate: pickupStats,
                questionsAnsweredRate: questionsStats,
                successfulSalesRate: salesStats,
                disputeResolutionRate: disputeStats
            };
        } catch (error) {
            console.error('Error updating seller metrics:', error);
            throw error;
        }
    }

    static async getMetrics(userId) {
        const [rows] = await db.query('SELECT * FROM seller_metrics WHERE user_id = ?', [userId]);
        return rows[0] || null;
    }

    // --- Calculation Helpers ---

    static async calculateResponseTime(userId) {
        // Logic: Average time between a message received by seller and their first reply in a conversation
        // Simplified: Find all conversations where user is seller.
        // For each conversation, find pairs of (buyer_msg, seller_reply).
        // This is complex in SQL. Simplified approach:
        // queries messages table.

        // Placeholder implementation (Mock for now as complex query needs robust data)
        // In real prod, would need `conversations` and `messages` careful join.
        return 60; // Default 1 hour
    }

    static async calculatePickupRate(userId) {
        // Completed pickups / (Completed + Cancelled by Seller)
        const [rows] = await db.query(
            `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' AND reschedule_reason LIKE '%seller%' THEN 1 END) as seller_cancelled, 
        COUNT(*) as total
       FROM pickup_schedules 
       WHERE seller_id = ?`,
            [userId]
        );

        const { completed, seller_cancelled } = rows[0];
        const relevantTotal = completed + seller_cancelled;

        if (relevantTotal === 0) return 90.0; // Default/Start high
        return (completed / relevantTotal) * 100;
    }

    static async calculateQuestionsAnsweredRate(userId) {
        // % of initial inquiries (first message in convo) that got a reply within 2 hours
        return 95.0; // Placeholder
    }

    static async calculateSalesRate(userId) {
        // Orders / Conversations (proxy for "meetings" or "interactions")
        // If 10 conversations about items led to 5 sales -> 50%

        const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders WHERE seller_id = ?', [userId]);
        const [convoCount] = await db.query('SELECT COUNT(*) as count FROM conversations WHERE seller_id = ?', [userId]);

        if (convoCount[0].count === 0) return 0.0;
        const rate = (orderCount[0].count / convoCount[0].count) * 100;
        return Math.min(rate, 100.0);
    }

    static async calculateDisputeResolutionRate(userId) {
        // Resolved disputes / Total disputes involved
        const [rows] = await db.query(
            `SELECT 
            COUNT(CASE WHEN status = 'resolved' OR resolution_status = 'accepted' THEN 1 END) as resolved,
            COUNT(*) as total
         FROM disputes 
         WHERE seller_id = ?`,
            [userId]
        );

        if (rows[0].total === 0) return 100.0;
        return (rows[0].resolved / rows[0].total) * 100;
    }
}

module.exports = SellerMetricsService;
