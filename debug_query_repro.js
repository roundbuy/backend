const { promisePool } = require('./src/config/database');

async function debug() {
    try {
        console.log("--- Debugging Analytics Query ---");

        const tourId = 'registration_tour';
        const startDateStr = '2026-01-04T13:25:14.711Z';
        const endDateStr = '2026-02-03T23:59:59.999Z';
        // Note: I extended the end date slightly to be absolutely sure, 
        // but the original query end date was 13:25, which is AFTER 12:24 (data point).

        // 1. Check Raw Data Count
        const [allRows] = await promisePool.query("SELECT created_at, tour_id FROM onboarding_events");
        console.log(`Total rows in table: ${allRows.length}`);
        if (allRows.length > 0) {
            console.log("Sample row 1:", allRows[0]);
            console.log("Sample created_at type:", typeof allRows[0].created_at);
        }

        // 2. Query with Strings
        const query = `
            SELECT COUNT(*) as count 
            FROM onboarding_events 
            WHERE tour_id = ? AND created_at BETWEEN ? AND ?
        `;

        console.log("\nTesting with STRINGS:");
        const [resStrings] = await promisePool.query(query, [tourId, startDateStr, endDateStr]);
        console.log("Result:", resStrings[0].count);

        // 3. Query with Date Objects
        console.log("\nTesting with DATE OBJECTS:");
        const [resDates] = await promisePool.query(query, [tourId, new Date(startDateStr), new Date(endDateStr)]);
        console.log("Result:", resDates[0].count);

        // 4. Test "Eligible Users" query (no tour_id)
        const eligibleQuery = `SELECT COUNT(DISTINCT session_id) as count FROM onboarding_events WHERE created_at BETWEEN ? AND ?`;
        const [resEligible] = await promisePool.query(eligibleQuery, [startDateStr, endDateStr]);
        console.log("\nEligible Users (Strings):", resEligible[0].count);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

debug();
