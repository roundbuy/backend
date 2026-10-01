const { promisePool } = require('../../config/database');

// ─── Source metadata (no external API needed — classified locally) ───────────
const SOURCE_META = {
    organic:            { label: 'Organic Search',      category: 'organic',  color: '#1e3a8a', icon: 'search' },
    paid:               { label: 'Paid Ads (PPC)',      category: 'paid',     color: '#7c3aed', icon: 'ads_click' },
    referral:           { label: 'Referral / Backlinks',category: 'referral', color: '#0891b2', icon: 'link' },
    chatgpt:            { label: 'ChatGPT',             category: 'ai',       color: '#10a37f', icon: 'smart_toy' },
    gemini:             { label: 'Google Gemini',       category: 'ai',       color: '#4285f4', icon: 'auto_awesome' },
    perplexity:         { label: 'Perplexity AI',       category: 'ai',       color: '#20b2aa', icon: 'psychology' },
    google_ai_overview: { label: 'Google AI Overview',  category: 'ai',       color: '#ea4335', icon: 'google' },
};

const CATEGORY_META = {
    organic:  { label: 'Organic Search', color: '#1e3a8a' },
    paid:     { label: 'Paid Advertising', color: '#7c3aed' },
    referral: { label: 'Referral', color: '#0891b2' },
    ai:       { label: 'AI Referrers', color: '#10b981' },
};

/**
 * GET /admin/marketplace-dashboard/traffic
 * Returns full traffic analytics breakdown: per-source, per-category, daily trend
 */
exports.getTrafficAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, granularity = 'daily' } = req.query;

        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        // ── 1. Per-source totals ──────────────────────────────────────────────
        const [sourceTotals] = await promisePool.query(`
            SELECT 
                source_name,
                SUM(visitor_count)  AS total_visitors,
                COUNT(DISTINCT date) AS active_days,
                MIN(visitor_count)  AS min_daily,
                MAX(visitor_count)  AS max_daily,
                ROUND(AVG(visitor_count), 1) AS avg_daily
            FROM traffic_analytics
            WHERE date BETWEEN DATE(?) AND DATE(?)
            GROUP BY source_name
            ORDER BY total_visitors DESC
        `, [start, end]);

        // ── 2. Daily trend per source ─────────────────────────────────────────
        const [dailyRaw] = await promisePool.query(`
            SELECT 
                DATE_FORMAT(date, '%Y-%m-%d') AS day,
                source_name,
                SUM(visitor_count) AS visitors
            FROM traffic_analytics
            WHERE date BETWEEN DATE(?) AND DATE(?)
            GROUP BY day, source_name
            ORDER BY day ASC
        `, [start, end]);

        // ── 3. Category-level aggregation ─────────────────────────────────────
        // Enrich source totals with metadata and compute category rollups
        const enrichedSources = sourceTotals.map(row => ({
            ...row,
            total_visitors: parseInt(row.total_visitors),
            ...(SOURCE_META[row.source_name] || { label: row.source_name, category: 'other', color: '#94a3b8', icon: 'device_unknown' }),
        }));

        const grandTotal = enrichedSources.reduce((s, r) => s + r.total_visitors, 0);

        const byCategory = {};
        enrichedSources.forEach(src => {
            const cat = src.category;
            if (!byCategory[cat]) {
                byCategory[cat] = {
                    category: cat,
                    ...(CATEGORY_META[cat] || { label: cat, color: '#94a3b8' }),
                    total_visitors: 0,
                    sources: []
                };
            }
            byCategory[cat].total_visitors += src.total_visitors;
            byCategory[cat].sources.push(src);
        });

        // Add share % per category and source
        const categories = Object.values(byCategory).map(cat => ({
            ...cat,
            share_pct: grandTotal > 0 ? parseFloat(((cat.total_visitors / grandTotal) * 100).toFixed(1)) : 0,
            sources: cat.sources.map(s => ({
                ...s,
                share_pct: grandTotal > 0 ? parseFloat(((s.total_visitors / grandTotal) * 100).toFixed(1)) : 0
            }))
        })).sort((a, b) => b.total_visitors - a.total_visitors);

        // ── 4. Pivot daily data into chart-friendly shape ────────────────────
        // Format: [{ day, organic, paid, chatgpt, ... }, ...]
        const dayMap = {};
        dailyRaw.forEach(({ day, source_name, visitors }) => {
            if (!dayMap[day]) dayMap[day] = { day };
            dayMap[day][source_name] = parseInt(visitors);
        });
        const dailyTrend = Object.values(dayMap);

        // ── 5. AI vs Non-AI summary ───────────────────────────────────────────
        const aiTotal = enrichedSources
            .filter(s => s.category === 'ai')
            .reduce((sum, s) => sum + s.total_visitors, 0);
        const nonAiTotal = grandTotal - aiTotal;
        const aiGrowthEstimate = aiTotal > 0 ? '+' + (((aiTotal / (nonAiTotal || 1)) * 100).toFixed(1)) + '% vs non-AI' : 'N/A';

        // ── 6. Top AI source ──────────────────────────────────────────────────
        const aiSources = enrichedSources.filter(s => s.category === 'ai');
        const topAiSource = aiSources[0] || null;

        res.json({
            success: true,
            data: {
                summary: {
                    total_visitors: grandTotal,
                    ai_visitors: aiTotal,
                    non_ai_visitors: nonAiTotal,
                    ai_share_pct: grandTotal > 0 ? parseFloat(((aiTotal / grandTotal) * 100).toFixed(1)) : 0,
                    ai_growth_note: aiGrowthEstimate,
                    top_ai_source: topAiSource ? topAiSource.label : null,
                    top_source: enrichedSources[0] ? enrichedSources[0].label : null,
                    date_range: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
                },
                by_source: enrichedSources.map(s => ({ ...s, share_pct: grandTotal > 0 ? parseFloat(((s.total_visitors / grandTotal) * 100).toFixed(1)) : 0 })),
                by_category: categories,
                daily_trend: dailyTrend
            }
        });
    } catch (error) {
        console.error('Error fetching traffic analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch traffic analytics' });
    }
};
