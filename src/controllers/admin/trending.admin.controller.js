const { promisePool } = require('../../config/database');

/**
 * POST /api/v1/admin/trending/galleries
 * Create a new trending gallery
 */
exports.createGallery = async (req, res) => {
    try {
        const { name, slug, gallery_type, category_slug, description, hero_image_url, is_active = 1, is_auto_populated = 0, sort_order = 0 } = req.body;
        const created_by = req.user.id;

        const [result] = await promisePool.execute(`
            INSERT INTO trending_galleries 
            (name, slug, gallery_type, category_slug, description, hero_image_url, is_active, is_auto_populated, sort_order, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, slug, gallery_type, category_slug, description, hero_image_url, is_active, is_auto_populated, sort_order, created_by]);

        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'create_trending_gallery', 'trending_gallery', result.insertId, JSON.stringify({ name, slug })]
        );

        res.status(201).json({ success: true, message: 'Gallery created', data: { id: result.insertId } });
    } catch (error) {
        console.error('Error creating gallery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/v1/admin/trending/galleries/:id
 * Edit gallery
 */
exports.updateGallery = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, gallery_type, category_slug, description, hero_image_url, is_active, is_auto_populated, sort_order } = req.body;

        await promisePool.execute(`
            UPDATE trending_galleries 
            SET name = ?, slug = ?, gallery_type = ?, category_slug = ?, description = ?, hero_image_url = ?, is_active = ?, is_auto_populated = ?, sort_order = ?
            WHERE id = ?
        `, [name, slug, gallery_type, category_slug, description, hero_image_url, is_active, is_auto_populated, sort_order, id]);

        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'update_trending_gallery', 'trending_gallery', id, JSON.stringify({ name, is_active })]
        );

        res.json({ success: true, message: 'Gallery updated' });
    } catch (error) {
        console.error('Error updating gallery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /api/v1/admin/trending/galleries/:id
 * Delete gallery
 */
exports.deleteGallery = async (req, res) => {
    try {
        const { id } = req.params;
        
        await promisePool.execute('DELETE FROM trending_gallery_items WHERE gallery_id = ?', [id]);
        await promisePool.execute('DELETE FROM trending_galleries WHERE id = ?', [id]);

        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'delete_trending_gallery', 'trending_gallery', id, null]
        );

        res.json({ success: true, message: 'Gallery deleted' });
    } catch (error) {
        console.error('Error deleting gallery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/admin/trending/galleries
 * Get all galleries for admin
 */
exports.getGalleries = async (req, res) => {
    try {
        const [galleries] = await promisePool.execute(`SELECT * FROM trending_galleries ORDER BY sort_order ASC, created_at DESC`);
        res.json({ success: true, data: { galleries } });
    } catch (error) {
        console.error('Error fetching admin galleries:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/admin/trending/galleries/:id/items
 * Get items for a gallery for admin
 */
exports.getGalleryItems = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await promisePool.execute(`
            SELECT tgi.id as mapping_id, tgi.is_featured, tgi.sort_order as gallery_sort, a.*
            FROM trending_gallery_items tgi
            JOIN advertisements a ON tgi.advertisement_id = a.id
            WHERE tgi.gallery_id = ?
            ORDER BY tgi.sort_order ASC, tgi.added_at DESC
        `, [id]);

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
        console.error('Error fetching admin gallery items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/admin/trending/galleries/:id/items
 * Add item to gallery
 */
exports.addItemToGallery = async (req, res) => {
    try {
        const { id } = req.params;
        const { advertisement_id, is_featured = 0, sort_order = 0 } = req.body;
        const added_by = req.user.id;

        // Check if already exists
        const [existing] = await promisePool.execute(
            'SELECT * FROM trending_gallery_items WHERE gallery_id = ? AND advertisement_id = ?', 
            [id, advertisement_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Advertisement already in gallery' });
        }

        await promisePool.execute(`
            INSERT INTO trending_gallery_items 
            (gallery_id, advertisement_id, is_featured, sort_order, added_by) 
            VALUES (?, ?, ?, ?, ?)
        `, [id, advertisement_id, is_featured, sort_order, added_by]);

        res.status(201).json({ success: true, message: 'Item added to gallery' });
    } catch (error) {
        console.error('Error adding item to gallery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /api/v1/admin/trending/galleries/:id/items/:itemId
 * Remove item from gallery
 * Note: itemId here can be the mapping_id or advertisement_id. Assuming mapping_id for precision.
 */
exports.removeItemFromGallery = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        
        await promisePool.execute(
            'DELETE FROM trending_gallery_items WHERE gallery_id = ? AND advertisement_id = ?', 
            [id, itemId]
        );

        res.json({ success: true, message: 'Item removed from gallery' });
    } catch (error) {
        console.error('Error removing item from gallery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/v1/admin/trending/galleries/:id/items/reorder
 * Bulk reorder items
 */
exports.reorderItems = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // Array of { advertisement_id, sort_order }

        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of items) {
                await connection.execute(
                    'UPDATE trending_gallery_items SET sort_order = ? WHERE gallery_id = ? AND advertisement_id = ?',
                    [item.sort_order, id, item.advertisement_id]
                );
            }
            await connection.commit();
            res.json({ success: true, message: 'Items reordered' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error reordering items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
