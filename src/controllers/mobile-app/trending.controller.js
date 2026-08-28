const { promisePool } = require('../../config/database');

/**
 * GET /api/v1/mobile-app/trending/galleries
 * List all active trending galleries
 */
exports.getGalleries = async (req, res) => {
    try {
        const [galleries] = await promisePool.query(`
            SELECT * FROM trending_galleries 
            WHERE is_active = 1 
            ORDER BY sort_order ASC, created_at DESC
        `);

        res.json({ success: true, data: { galleries } });
    } catch (error) {
        console.error('Error fetching trending galleries:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/trending/galleries/:id/items
 * Get items (advertisements) for a specific trending gallery
 */
exports.getGalleryItems = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await promisePool.query(`
            SELECT a.*, tgi.is_featured, tgi.sort_order as gallery_sort
            FROM trending_gallery_items tgi
            JOIN advertisements a ON tgi.advertisement_id = a.id
            WHERE tgi.gallery_id = ? AND a.status = 'published'
            ORDER BY tgi.sort_order ASC, tgi.added_at DESC
        `, [id]);

        // Transform images string to array if necessary, just like typical advertisement routes
        const processedItems = items.map(item => {
            if (item.images && typeof item.images === 'string') {
                try {
                    item.images = JSON.parse(item.images);
                } catch (e) {
                    item.images = [];
                }
            }
            return item;
        });

        res.json({ success: true, data: { items: processedItems } });
    } catch (error) {
        console.error('Error fetching gallery items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/trending/feed
 * Filtered trending items (for generic trending feed without a specific gallery)
 * Query params: type (general, women, men, children), category
 */
exports.getTrendingFeed = async (req, res) => {
    try {
        const { type, category, limit = 50 } = req.query;

        let query = `
            SELECT * FROM advertisements 
            WHERE status = 'published'
        `;
        const params = [];

        if (type && type !== 'general' && type !== 'all') {
            query += ` AND gender_target = ?`;
            params.push(type);
        }

        if (category) {
            query += ` AND category_id = (SELECT id FROM categories WHERE name = ? LIMIT 1)`;
            params.push(category);
        }

        query += ` ORDER BY trending_score DESC, views_count DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [items] = await promisePool.query(query, params);

        const processedItems = items.map(item => {
            if (item.images && typeof item.images === 'string') {
                try {
                    item.images = JSON.parse(item.images);
                } catch (e) {
                    item.images = [];
                }
            }
            return item;
        });

        res.json({ success: true, data: { items: processedItems } });
    } catch (error) {
        console.error('Error fetching trending feed:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
