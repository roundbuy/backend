const { promisePool } = require('../../config/database');

exports.trackEvent = async (req, res) => {
    try {
        const { tour_id, step_index, action, session_id, device_type, user_id } = req.body;

        if (!tour_id || !action || !session_id) {
            return res.status(400).send({ message: "Missing required fields: tour_id, action, session_id" });
        }

        const query = `
      INSERT INTO onboarding_events (tour_id, step_index, action, session_id, device_type, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        await promisePool.query(query, [tour_id, step_index, action, session_id, device_type, user_id || null]);

        res.status(200).send({ message: "Event tracked successfully" });
    } catch (error) {
        console.error("Error tracking onboarding event:", error);
        res.status(500).send({ message: "Internal server error" });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        console.log("🔥 getAnalytics controller HIT");
        const { tourId, startDate, endDate, compareStartDate, compareEndDate, filters } = req.query;
        console.log("Params:", { tourId, startDate, endDate });



        const baseQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_users,
        SUM(CASE WHEN action = 'finish' THEN 1 ELSE 0 END) as finished_count,
        SUM(CASE WHEN action = 'skip' THEN 1 ELSE 0 END) as skipped_count,
        SUM(CASE WHEN action = 'error' THEN 1 ELSE 0 END) as issues_count,
        AVG(CASE WHEN action = 'finish' THEN 
            TIMESTAMPDIFF(SECOND, 
                (SELECT MIN(created_at) FROM onboarding_events e2 WHERE e2.session_id = onboarding_events.session_id AND e2.tour_id = onboarding_events.tour_id), 
                created_at
            ) 
        ELSE NULL END) as avg_time
      FROM onboarding_events
      WHERE tour_id = ? AND created_at BETWEEN ? AND ?
    `;

        // Note: detailed implementation for comparison and complex filters would go here.
        // For now returning basic aggregated stats matching the requested dashboard structure.

        // Eligible Users (Assuming new registrations/sessions in the period)
        const eligibleQuery = `SELECT COUNT(DISTINCT session_id) as count FROM onboarding_events WHERE created_at BETWEEN ? AND ?`; // Proxy for eligible users

        // Chart Data Query: Group by date (daily trend)
        const chartQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as events,
            COUNT(DISTINCT session_id) as users,
            SUM(CASE WHEN action = 'finish' THEN 1 ELSE 0 END) as completions
          FROM onboarding_events
          WHERE tour_id = ? AND created_at BETWEEN ? AND ?
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `;

        const start = new Date(startDate);
        const end = new Date(endDate);

        const [currentStats] = await promisePool.query(baseQuery, [tourId, start, end]);
        const [eligibleUsers] = await promisePool.query(eligibleQuery, [start, end]);
        const [chartData] = await promisePool.query(chartQuery, [tourId, start, end]);

        let compareStats = [{}];
        if (compareStartDate && compareEndDate) {
            const compareStart = new Date(compareStartDate);
            const compareEnd = new Date(compareEndDate);
            [compareStats] = await promisePool.query(baseQuery, [tourId, compareStart, compareEnd]);
        }

        const responseData = {
            current: {
                ...currentStats[0],
                eligibleUsers: eligibleUsers[0].count
            },
            compare: {
                ...compareStats[0]
            },
            chartData // Return the time-series data
        };
        console.log("Response Data:", JSON.stringify(responseData, null, 2));

        res.status(200).send(responseData);

    } catch (error) {
        console.error("Error fetching onboarding analytics:", error);
        res.status(500).send({ message: "Internal server error" });
    }
};
