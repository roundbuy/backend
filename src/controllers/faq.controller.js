/**
 * Public FAQ Controller
 * 
 * Handles public-facing FAQ operations for frontend and mobile app.
 * No authentication required.
 */

const { promisePool: db } = require('../config/database');

/**
 * Get all active FAQ categories with subcategories
 * GET /api/v1/faqs/categories
 */
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.execute(
            `SELECT 
                c.id,
                c.name,
                c.description,
                c.sort_order
             FROM faq_categories c
             WHERE c.is_active = TRUE
             ORDER BY c.sort_order ASC`
        );

        // Get subcategories for each category
        for (let category of categories) {
            const [subcategories] = await db.execute(
                `SELECT 
                    s.id,
                    s.name,
                    s.description,
                    s.sort_order
                 FROM faq_subcategories s
                 WHERE s.category_id = ? AND s.is_active = TRUE
                 ORDER BY s.sort_order ASC`,
                [category.id]
            );
            category.subcategories = subcategories;
        }

        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch categories'
        });
    }
};

/**
 * Get all active FAQs organized by category and subcategory
 * GET /api/v1/faqs
 */
exports.getAllFaqs = async (req, res) => {
    try {
        const { category_id, subcategory_id, search } = req.query;

        let query = `
            SELECT 
                f.id,
                f.category_id,
                f.subcategory_id,
                f.question,
                f.answer,
                f.sort_order,
                c.name as category_name,
                s.name as subcategory_name
            FROM faqs f
            LEFT JOIN faq_categories c ON f.category_id = c.id
            LEFT JOIN faq_subcategories s ON f.subcategory_id = s.id
            WHERE f.is_active = TRUE
        `;

        const params = [];

        if (category_id) {
            query += ' AND f.category_id = ?';
            params.push(category_id);
        }

        if (subcategory_id) {
            query += ' AND f.subcategory_id = ?';
            params.push(subcategory_id);
        }

        if (search) {
            query += ' AND (f.question LIKE ? OR f.answer LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY f.category_id, f.subcategory_id, f.sort_order ASC';

        const [faqs] = await db.execute(query, params);

        res.json({
            success: true,
            faqs,
            count: faqs.length
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
 * Get FAQs organized hierarchically (category > subcategory > faqs)
 * GET /api/v1/faqs/organized
 */
exports.getOrganizedFaqs = async (req, res) => {
    try {
        // Get all active categories
        const [categories] = await db.execute(
            `SELECT id, name, description, sort_order
             FROM faq_categories
             WHERE is_active = TRUE
             ORDER BY sort_order ASC`
        );

        // For each category, get subcategories and their FAQs
        for (let category of categories) {
            const [subcategories] = await db.execute(
                `SELECT id, name, description, sort_order
                 FROM faq_subcategories
                 WHERE category_id = ? AND is_active = TRUE
                 ORDER BY sort_order ASC`,
                [category.id]
            );

            // For each subcategory, get FAQs
            for (let subcategory of subcategories) {
                const [faqs] = await db.execute(
                    `SELECT id, question, answer, sort_order
                     FROM faqs
                     WHERE subcategory_id = ? AND is_active = TRUE
                     ORDER BY sort_order ASC`,
                    [subcategory.id]
                );
                subcategory.faqs = faqs;
            }

            category.subcategories = subcategories;
        }

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get organized FAQs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch organized FAQs'
        });
    }
};

/**
 * Get single FAQ by ID
 * GET /api/v1/faqs/:id
 */
exports.getFaqById = async (req, res) => {
    try {
        const { id } = req.params;

        const [faqs] = await db.execute(
            `SELECT 
                f.id,
                f.question,
                f.answer,
                f.category_id,
                f.subcategory_id,
                c.name as category_name,
                s.name as subcategory_name
             FROM faqs f
             LEFT JOIN faq_categories c ON f.category_id = c.id
             LEFT JOIN faq_subcategories s ON f.subcategory_id = s.id
             WHERE f.id = ? AND f.is_active = TRUE`,
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
 * Search FAQs
 * GET /api/v1/faqs/search
 */
exports.searchFaqs = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${q}%`;

        const [faqs] = await db.execute(
            `SELECT 
                f.id,
                f.question,
                f.answer,
                c.name as category_name,
                s.name as subcategory_name
             FROM faqs f
             LEFT JOIN faq_categories c ON f.category_id = c.id
             LEFT JOIN faq_subcategories s ON f.subcategory_id = s.id
             WHERE f.is_active = TRUE 
             AND (f.question LIKE ? OR f.answer LIKE ?)
             ORDER BY 
                CASE 
                    WHEN f.question LIKE ? THEN 1
                    ELSE 2
                END,
                f.sort_order ASC
             LIMIT 20`,
            [searchTerm, searchTerm, searchTerm]
        );

        res.json({
            success: true,
            results: faqs,
            count: faqs.length
        });
    } catch (error) {
        console.error('Search FAQs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to search FAQs'
        });
    }
};
