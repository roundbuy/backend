const { promisePool } = require('../../config/database');

/**
 * Get all active FAQs grouped by category and subcategory
 * GET /api/v1/mobile-app/faqs
 * 
 * Returns FAQs in a hierarchical structure optimized for mobile UI:
 * - Categories with subcategories
 * - Each subcategory contains its FAQs
 * - Only active items are returned
 */
exports.getActiveFaqs = async (req, res) => {
    try {
        const { category_id } = req.query;

        // Build query for categories
        let categoryQuery = `
      SELECT id, name, description, sort_order
      FROM faq_categories
      WHERE is_active = TRUE
    `;
        const categoryParams = [];

        if (category_id) {
            categoryQuery += ' AND id = ?';
            categoryParams.push(category_id);
        }

        categoryQuery += ' ORDER BY sort_order ASC';

        const [categories] = await promisePool.execute(categoryQuery, categoryParams);

        // For each category, get subcategories with their FAQs
        for (let category of categories) {
            const [subcategories] = await promisePool.execute(
                `SELECT id, name, description, sort_order
         FROM faq_subcategories
         WHERE category_id = ? AND is_active = TRUE
         ORDER BY sort_order ASC`,
                [category.id]
            );

            // For each subcategory, get FAQs
            for (let subcategory of subcategories) {
                const [faqs] = await promisePool.execute(
                    `SELECT id, question, answer, sort_order
           FROM faqs
           WHERE subcategory_id = ? AND is_active = TRUE
           ORDER BY sort_order ASC`,
                    [subcategory.id]
                );
                subcategory.faqs = faqs;
                subcategory.faq_count = faqs.length;
            }

            category.subcategories = subcategories;
            category.subcategory_count = subcategories.length;

            // Calculate total FAQs in this category
            category.total_faqs = subcategories.reduce((sum, sub) => sum + sub.faq_count, 0);
        }

        res.json({
            success: true,
            data: {
                categories,
                total_categories: categories.length,
                total_faqs: categories.reduce((sum, cat) => sum + cat.total_faqs, 0)
            }
        });
    } catch (error) {
        console.error('Get active FAQs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching FAQs',
            error: error.message
        });
    }
};

/**
 * Search FAQs by question or answer
 * GET /api/v1/mobile-app/faqs/search?q=keyword
 * 
 * Returns matching FAQs with category and subcategory information
 * Results are ranked by relevance (question matches first)
 */
exports.searchFaqs = async (req, res) => {
    try {
        const { q } = req.query;

        // Validate search query
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${q.trim()}%`;

        // Search FAQs with category and subcategory info
        const [results] = await promisePool.execute(
            `SELECT 
        f.id,
        f.question,
        f.answer,
        f.category_id,
        f.subcategory_id,
        c.name as category_name,
        s.name as subcategory_name,
        CASE 
          WHEN f.question LIKE ? THEN 1
          ELSE 2
        END as relevance
       FROM faqs f
       LEFT JOIN faq_categories c ON f.category_id = c.id
       LEFT JOIN faq_subcategories s ON f.subcategory_id = s.id
       WHERE f.is_active = TRUE 
       AND c.is_active = TRUE
       AND s.is_active = TRUE
       AND (f.question LIKE ? OR f.answer LIKE ?)
       ORDER BY relevance ASC, f.sort_order ASC
       LIMIT 20`,
            [searchTerm, searchTerm, searchTerm]
        );

        res.json({
            success: true,
            data: {
                results,
                count: results.length,
                query: q
            }
        });
    } catch (error) {
        console.error('Search FAQs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching FAQs',
            error: error.message
        });
    }
};

/**
 * Get FAQs by category
 * GET /api/v1/mobile-app/faqs/category/:categoryId
 * 
 * Returns all subcategories and FAQs for a specific category
 */
exports.getFaqsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Get category details
        const [categories] = await promisePool.execute(
            `SELECT id, name, description, sort_order
       FROM faq_categories
       WHERE id = ? AND is_active = TRUE`,
            [categoryId]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const category = categories[0];

        // Get subcategories with FAQs
        const [subcategories] = await promisePool.execute(
            `SELECT id, name, description, sort_order
       FROM faq_subcategories
       WHERE category_id = ? AND is_active = TRUE
       ORDER BY sort_order ASC`,
            [categoryId]
        );

        // For each subcategory, get FAQs
        for (let subcategory of subcategories) {
            const [faqs] = await promisePool.execute(
                `SELECT id, question, answer, sort_order
         FROM faqs
         WHERE subcategory_id = ? AND is_active = TRUE
         ORDER BY sort_order ASC`,
                [subcategory.id]
            );
            subcategory.faqs = faqs;
            subcategory.faq_count = faqs.length;
        }

        category.subcategories = subcategories;
        category.total_faqs = subcategories.reduce((sum, sub) => sum + sub.faq_count, 0);

        res.json({
            success: true,
            data: {
                category
            }
        });
    } catch (error) {
        console.error('Get FAQs by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category FAQs',
            error: error.message
        });
    }
};

/**
 * Get single FAQ by ID
 * GET /api/v1/mobile-app/faqs/:id
 * 
 * Returns a single FAQ with category and subcategory information
 */
exports.getFaqById = async (req, res) => {
    try {
        const { id } = req.params;

        const [faqs] = await promisePool.execute(
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
            data: {
                faq: faqs[0]
            }
        });
    } catch (error) {
        console.error('Get FAQ by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching FAQ',
            error: error.message
        });
    }
};

/**
 * Get FAQ categories only (lightweight)
 * GET /api/v1/mobile-app/faqs/categories
 * 
 * Returns just the list of categories with counts
 */
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await promisePool.execute(
            `SELECT 
        c.id,
        c.name,
        c.description,
        c.sort_order,
        COUNT(DISTINCT s.id) as subcategory_count,
        COUNT(f.id) as faq_count
       FROM faq_categories c
       LEFT JOIN faq_subcategories s ON c.id = s.category_id AND s.is_active = TRUE
       LEFT JOIN faqs f ON s.id = f.subcategory_id AND f.is_active = TRUE
       WHERE c.is_active = TRUE
       GROUP BY c.id, c.name, c.description, c.sort_order
       ORDER BY c.sort_order ASC`
        );

        res.json({
            success: true,
            data: {
                categories,
                total: categories.length
            }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};
