const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { promisePool: db } = require('../config/database');

// Configure multer for CSV upload
const upload = multer({
    dest: 'uploads/csv/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

/**
 * @route   POST /api/v1/demo/upload-csv
 * @desc    Upload and import CSV data into advertisements_demo table
 * @access  Public (no auth required)
 */
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No CSV file uploaded'
            });
        }

        const results = [];
        const filePath = req.file.path;

        // Parse CSV file
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Clear existing demo data
                    await db.query('DELETE FROM advertisements_demo');

                    // Process and insert each row
                    for (const row of results) {
                        const adData = processCSVRow(row);
                        await insertDemoAd(adData);
                    }

                    // Clean up uploaded file
                    fs.unlinkSync(filePath);

                    res.json({
                        success: true,
                        message: `Successfully imported ${results.length} demo advertisements`,
                        count: results.length
                    });
                } catch (error) {
                    console.error('Error processing CSV:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error processing CSV data',
                        error: error.message
                    });
                }
            })
            .on('error', (error) => {
                console.error('Error reading CSV:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error reading CSV file',
                    error: error.message
                });
            });
    } catch (error) {
        console.error('Upload CSV error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/v1/demo/advertisements
 * @desc    Get demo advertisements (similar to browse endpoint)
 * @access  Public (no auth required)
 */
router.get('/advertisements', async (req, res) => {
    try {
        const {
            search,
            category_id,
            subcategory_id,
            activity_id,
            condition_id,
            min_price,
            max_price,
            latitude,
            longitude,
            radius = 50, // km
            sort = 'created_at',
            order = 'DESC',
            page = 1,
            limit = 20
        } = req.query;

        let query = `
            SELECT 
                ad.*,
                ${latitude && longitude ? `
                    (6371 * acos(cos(radians(?)) * cos(radians(ad.latitude)) * 
                    cos(radians(ad.longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(ad.latitude)))) AS distance
                ` : '0 AS distance'}
            FROM advertisements_demo ad
            WHERE ad.status = 'active'
        `;

        const queryParams = [];

        if (latitude && longitude) {
            queryParams.push(latitude, longitude, latitude);
        }

        // Search filter
        if (search) {
            query += ` AND (ad.title LIKE ? OR ad.description LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Category filters
        if (category_id) {
            query += ` AND ad.category_id = ?`;
            queryParams.push(category_id);
        }

        if (subcategory_id) {
            query += ` AND ad.subcategory_id = ?`;
            queryParams.push(subcategory_id);
        }

        if (activity_id) {
            query += ` AND ad.activity_id = ?`;
            queryParams.push(activity_id);
        }

        if (condition_id) {
            query += ` AND ad.condition_id = ?`;
            queryParams.push(condition_id);
        }

        // Price range
        if (min_price) {
            query += ` AND ad.price >= ?`;
            queryParams.push(min_price);
        }

        if (max_price) {
            query += ` AND ad.price <= ?`;
            queryParams.push(max_price);
        }

        // Distance filter
        if (latitude && longitude && radius) {
            query += ` HAVING distance <= ?`;
            queryParams.push(radius);
        }

        // Sorting
        const validSortFields = ['created_at', 'price', 'title', 'distance'];
        const validOrders = ['ASC', 'DESC'];
        const sortField = validSortFields.includes(sort) ? sort : 'created_at';
        const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

        query += ` ORDER BY ${sortField} ${sortOrder}`;

        // Pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));

        const [advertisements] = await db.query(query, queryParams);

        // Parse images JSON
        advertisements.forEach(ad => {
            if (ad.images) {
                try {
                    ad.images = typeof ad.images === 'string' ? JSON.parse(ad.images) : ad.images;
                } catch (e) {
                    ad.images = [];
                }
            } else {
                ad.images = [];
            }
        });

        res.json({
            success: true,
            data: {
                advertisements,
                page: parseInt(page),
                limit: parseInt(limit),
                total: advertisements.length
            }
        });
    } catch (error) {
        console.error('Get demo advertisements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/v1/demo/advertisements/:id
 * @desc    Get single demo advertisement
 * @access  Public
 */
router.get('/advertisements/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [advertisements] = await db.query(
            'SELECT * FROM advertisements_demo WHERE id = ?',
            [id]
        );

        if (advertisements.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Demo advertisement not found'
            });
        }

        const ad = advertisements[0];

        // Parse images
        if (ad.images) {
            try {
                ad.images = typeof ad.images === 'string' ? JSON.parse(ad.images) : ad.images;
            } catch (e) {
                ad.images = [];
            }
        }

        res.json({
            success: true,
            data: { advertisement: ad }
        });
    } catch (error) {
        console.error('Get demo advertisement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Helper function to process CSV row and fill missing data
function processCSVRow(row) {
    const title = row.title || row.Title || row.name || row.Name || 'Demo Product';
    const price = parseFloat(row.price || row.Price || inferPrice(title));
    const description = row.description || row.Description || inferDescription(title);
    const category_id = parseInt(row.category_id || row.CategoryId || 1);
    const activity_id = parseInt(row.activity_id || row.ActivityId || 1);
    const condition_id = parseInt(row.condition_id || row.ConditionId || 1);

    // Location data with defaults
    const latitude = parseFloat(row.latitude || row.Latitude || 26.77777);
    const longitude = parseFloat(row.longitude || row.Longitude || 81.0817);
    const city = row.city || row.City || 'Demo City';
    const state = row.state || row.State || 'Demo State';
    const country = row.country || row.Country || 'India';
    const location_name = row.location_name || row.LocationName || `${city}, ${state}`;

    // Images
    let images = [];
    if (row.images || row.Images) {
        try {
            images = JSON.parse(row.images || row.Images);
        } catch (e) {
            images = (row.images || row.Images).split(',').map(img => img.trim());
        }
    } else {
        images = ['https://via.placeholder.com/400x300?text=' + encodeURIComponent(title)];
    }

    return {
        title,
        description,
        price,
        category_id,
        subcategory_id: parseInt(row.subcategory_id || row.SubcategoryId || null) || null,
        activity_id,
        condition_id,
        location_id: parseInt(row.location_id || row.LocationId || null) || null,
        latitude,
        longitude,
        city,
        state,
        country,
        location_name,
        images: JSON.stringify(images),
        status: row.status || row.Status || 'active',
        user_id: 1 // Demo user
    };
}

// Infer price based on product name
function inferPrice(title) {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('car') || lowerTitle.includes('vehicle')) return 500000;
    if (lowerTitle.includes('bike') || lowerTitle.includes('motorcycle')) return 80000;
    if (lowerTitle.includes('laptop') || lowerTitle.includes('computer')) return 45000;
    if (lowerTitle.includes('phone') || lowerTitle.includes('mobile')) return 25000;
    if (lowerTitle.includes('furniture') || lowerTitle.includes('sofa')) return 15000;
    if (lowerTitle.includes('tv') || lowerTitle.includes('television')) return 30000;
    if (lowerTitle.includes('watch')) return 5000;
    if (lowerTitle.includes('book')) return 300;
    if (lowerTitle.includes('clothes') || lowerTitle.includes('shirt')) return 500;

    return 1000; // Default price
}

// Infer description based on product name
function inferDescription(title) {
    return `This is a demo listing for ${title}. Great condition, well-maintained, and ready for immediate use. Contact for more details and viewing.`;
}

// Insert demo advertisement
async function insertDemoAd(adData) {
    const query = `
        INSERT INTO advertisements_demo 
        (user_id, title, description, price, category_id, subcategory_id, activity_id, 
         condition_id, location_id, latitude, longitude, city, state, country, 
         location_name, images, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        adData.user_id,
        adData.title,
        adData.description,
        adData.price,
        adData.category_id,
        adData.subcategory_id,
        adData.activity_id,
        adData.condition_id,
        adData.location_id,
        adData.latitude,
        adData.longitude,
        adData.city,
        adData.state,
        adData.country,
        adData.location_name,
        adData.images,
        adData.status
    ];

    await db.query(query, values);
}

module.exports = router;
