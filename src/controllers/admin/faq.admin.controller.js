/**
 * Admin FAQ Controller
 * 
 * Handles admin operations for managing FAQs, categories, and subcategories.
 * Requires admin authentication.
 */

const { promisePool: db } = require('../../config/database');

// ==================== FAQ CATEGORIES ====================

/**
 * Get all FAQ categories
 * GET /api/v1/admin/faqs/categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { is_active } = req.query;

        let query = `
            SELECT 
                c.*,
                COUNT(s.id) as subcategory_count
            FROM faq_categories c
            LEFT JOIN faq_subcategories s ON c.id = s.category_id
        `;

        const params = [];
        if (is_active !== undefined) {
            query += ' WHERE c.is_active = ?';
            params.push(is_active === 'true');
        }

        query += ' GROUP BY c.id ORDER BY c.sort_order ASC';

        const [categories] = await db.execute(query, params);

        res.json({
            success: true,
            categories,
            count: categories.length
        });
    } catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch categories'
        });
    }
};

/**
 * Create FAQ category
 * POST /api/v1/admin/faqs/categories
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, description, sort_order, is_active } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO faq_categories (name, description, sort_order, is_active) 
             VALUES (?, ?, ?, ?)`,
            [name, description || null, sort_order || 0, is_active !== false]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            categoryId: result.insertId
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create category'
        });
    }
};

/**
 * Update FAQ category
 * PUT /api/v1/admin/faqs/categories/:id
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sort_order, is_active } = req.body;

        const [result] = await db.execute(
            `UPDATE faq_categories 
             SET name = ?, description = ?, sort_order = ?, is_active = ?
             WHERE id = ?`,
            [name, description, sort_order, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update category'
        });
    }
};

/**
 * Delete FAQ category
 * DELETE /api/v1/admin/faqs/categories/:id
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has subcategories
        const [subcategories] = await db.execute(
            'SELECT COUNT(*) as count FROM faq_subcategories WHERE category_id = ?',
            [id]
        );

        if (subcategories[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with subcategories. Delete subcategories first.'
            });
        }

        const [result] = await db.execute(
            'DELETE FROM faq_categories WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete category'
        });
    }
};

// ==================== FAQ SUBCATEGORIES ====================

/**
 * Get all FAQ subcategories
 * GET /api/v1/admin/faqs/subcategories
 */
exports.getAllSubcategories = async (req, res) => {
    try {
        const { category_id, is_active } = req.query;

        let query = `
            SELECT 
                s.*,
                c.name as category_name,
                COUNT(f.id) as faq_count
            FROM faq_subcategories s
            LEFT JOIN faq_categories c ON s.category_id = c.id
            LEFT JOIN faqs f ON s.id = f.subcategory_id
        `;

        const params = [];
        const conditions = [];

        if (category_id) {
            conditions.push('s.category_id = ?');
            params.push(category_id);
        }

        if (is_active !== undefined) {
            conditions.push('s.is_active = ?');
            params.push(is_active === 'true');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY s.id ORDER BY s.category_id, s.sort_order ASC';

        const [subcategories] = await db.execute(query, params);

        res.json({
            success: true,
            subcategories,
            count: subcategories.length
        });
    } catch (error) {
        console.error('Get all subcategories error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch subcategories'
        });
    }
};

/**
 * Create FAQ subcategory
 * POST /api/v1/admin/faqs/subcategories
 */
exports.createSubcategory = async (req, res) => {
    try {
        const { category_id, name, description, sort_order, is_active } = req.body;

        // Validate required fields
        if (!category_id || !name) {
            return res.status(400).json({
                success: false,
                message: 'Category ID and subcategory name are required'
            });
        }

        // Verify category exists
        const [category] = await db.execute(
            'SELECT id FROM faq_categories WHERE id = ?',
            [category_id]
        );

        if (category.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO faq_subcategories (category_id, name, description, sort_order, is_active) 
             VALUES (?, ?, ?, ?, ?)`,
            [category_id, name, description || null, sort_order || 0, is_active !== false]
        );

        res.status(201).json({
            success: true,
            message: 'Subcategory created successfully',
            subcategoryId: result.insertId
        });
    } catch (error) {
        console.error('Create subcategory error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create subcategory'
        });
    }
};

/**
 * Update FAQ subcategory
 * PUT /api/v1/admin/faqs/subcategories/:id
 */
exports.updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, description, sort_order, is_active } = req.body;

        const [result] = await db.execute(
            `UPDATE faq_subcategories 
             SET category_id = ?, name = ?, description = ?, sort_order = ?, is_active = ?
             WHERE id = ?`,
            [category_id, name, description, sort_order, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        res.json({
            success: true,
            message: 'Subcategory updated successfully'
        });
    } catch (error) {
        console.error('Update subcategory error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update subcategory'
        });
    }
};

/**
 * Delete FAQ subcategory
 * DELETE /api/v1/admin/faqs/subcategories/:id
 */
exports.deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subcategory has FAQs
        const [faqs] = await db.execute(
            'SELECT COUNT(*) as count FROM faqs WHERE subcategory_id = ?',
            [id]
        );

        if (faqs[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete subcategory with FAQs. Delete FAQs first.'
            });
        }

        const [result] = await db.execute(
            'DELETE FROM faq_subcategories WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        res.json({
            success: true,
            message: 'Subcategory deleted successfully'
        });
    } catch (error) {
        console.error('Delete subcategory error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete subcategory'
        });
    }
};

// ==================== FAQs ====================

/**
 * Get all FAQs with pagination and filters
 * GET /api/v1/admin/faqs
 */
exports.getAllFaqs = async (req, res) => {
    try {
        const {
            category_id,
            subcategory_id,
            is_active,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        let query = `
            SELECT 
                f.*,
                c.name as category_name,
                s.name as subcategory_name
            FROM faqs f
            LEFT JOIN faq_categories c ON f.category_id = c.id
            LEFT JOIN faq_subcategories s ON f.subcategory_id = s.id
        `;

        const params = [];
        const conditions = [];

        if (category_id) {
            conditions.push('f.category_id = ?');
            params.push(category_id);
        }

        if (subcategory_id) {
            conditions.push('f.subcategory_id = ?');
            params.push(subcategory_id);
        }

        if (is_active !== undefined) {
            conditions.push('f.is_active = ?');
            params.push(is_active === 'true');
        }

        if (search) {
            conditions.push('(f.question LIKE ? OR f.answer LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY f.category_id, f.subcategory_id, f.sort_order ASC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [faqs] = await db.execute(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM faqs f';
        const countParams = [];

        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            // Remove LIMIT and OFFSET params, keep search params
            for (let i = 0; i < params.length - 2; i++) {
                countParams.push(params[i]);
            }
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            faqs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + faqs.length < total
            }
        });
    } catch (error) {
        console.error('Get all FAQs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch FAQs'
        });
    }
};

/**
 * Get FAQ by ID
 * GET /api/v1/admin/faqs/:id
 */
exports.getFaqById = async (req, res) => {
    try {
        const { id } = req.params;

        const [faqs] = await db.execute(
            `SELECT 
                f.*,
                c.name as category_name,
                s.name as subcategory_name
             FROM faqs f
             LEFT JOIN faq_categories c ON f.category_id = c.id
             LEFT JOIN faq_subcategories s ON f.subcategory_id = s.id
             WHERE f.id = ?`,
            [id]
        );

        if (faqs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.json({
            success: true,
            faq: faqs[0]
        });
    } catch (error) {
        console.error('Get FAQ by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch FAQ'
        });
    }
};

/**
 * Create new FAQ
 * POST /api/v1/admin/faqs
 */
exports.createFaq = async (req, res) => {
    try {
        const {
            category_id,
            subcategory_id,
            question,
            answer,
            sort_order,
            is_active
        } = req.body;

        // Validate required fields
        if (!category_id || !subcategory_id || !question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Category ID, subcategory ID, question, and answer are required'
            });
        }

        // Verify category and subcategory exist
        const [category] = await db.execute(
            'SELECT id FROM faq_categories WHERE id = ?',
            [category_id]
        );

        if (category.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const [subcategory] = await db.execute(
            'SELECT id FROM faq_subcategories WHERE id = ? AND category_id = ?',
            [subcategory_id, category_id]
        );

        if (subcategory.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found or does not belong to the specified category'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [category_id, subcategory_id, question, answer, sort_order || 0, is_active !== false]
        );

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            faqId: result.insertId
        });
    } catch (error) {
        console.error('Create FAQ error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create FAQ'
        });
    }
};

/**
 * Update FAQ
 * PUT /api/v1/admin/faqs/:id
 */
exports.updateFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            category_id,
            subcategory_id,
            question,
            answer,
            sort_order,
            is_active
        } = req.body;

        // Verify subcategory belongs to category if both provided
        if (category_id && subcategory_id) {
            const [subcategory] = await db.execute(
                'SELECT id FROM faq_subcategories WHERE id = ? AND category_id = ?',
                [subcategory_id, category_id]
            );

            if (subcategory.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Subcategory does not belong to the specified category'
                });
            }
        }

        const [result] = await db.execute(
            `UPDATE faqs 
             SET category_id = ?, subcategory_id = ?, question = ?, answer = ?, 
                 sort_order = ?, is_active = ?
             WHERE id = ?`,
            [category_id, subcategory_id, question, answer, sort_order, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.json({
            success: true,
            message: 'FAQ updated successfully'
        });
    } catch (error) {
        console.error('Update FAQ error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update FAQ'
        });
    }
};

/**
 * Delete FAQ
 * DELETE /api/v1/admin/faqs/:id
 */
exports.deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM faqs WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.json({
            success: true,
            message: 'FAQ deleted successfully'
        });
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete FAQ'
        });
    }
};

/**
 * Update sort order for multiple FAQs
 * PUT /api/v1/admin/faqs/reorder
 */
exports.updateSortOrder = async (req, res) => {
    try {
        const { faqs } = req.body;

        if (!Array.isArray(faqs) || faqs.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'FAQs array is required'
            });
        }

        // Update each FAQ's sort order
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            for (const faq of faqs) {
                if (!faq.id || faq.sort_order === undefined) {
                    throw new Error('Each FAQ must have id and sort_order');
                }

                await connection.execute(
                    'UPDATE faqs SET sort_order = ? WHERE id = ?',
                    [faq.sort_order, faq.id]
                );
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'FAQ order updated successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update sort order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update FAQ order'
        });
    }
};

/**
 * Bulk update FAQ status (activate/deactivate)
 * PATCH /api/v1/admin/faqs/bulk-status
 */
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { faq_ids, is_active } = req.body;

        if (!Array.isArray(faq_ids) || faq_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'FAQ IDs array is required'
            });
        }

        if (is_active === undefined) {
            return res.status(400).json({
                success: false,
                message: 'is_active status is required'
            });
        }

        const placeholders = faq_ids.map(() => '?').join(',');
        const [result] = await db.execute(
            `UPDATE faqs SET is_active = ? WHERE id IN (${placeholders})`,
            [is_active, ...faq_ids]
        );

        res.json({
            success: true,
            message: `${result.affectedRows} FAQ(s) updated successfully`,
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Bulk update status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update FAQ status'
        });
    }
};
