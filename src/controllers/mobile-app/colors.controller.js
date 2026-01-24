const { promisePool } = require('../../config/database');

/**
 * Get all colors with their shades
 * GET /api/v1/mobile-app/colors
 */
const getColors = async (req, res) => {
    try {
        const [colors] = await promisePool.query(`
            SELECT 
                c.id,
                c.name,
                c.hex_code as baseHexCode,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', cs.id,
                        'shade', cs.shade,
                        'displayName', cs.display_name,
                        'hexCode', cs.hex_code
                    )
                ) as shades
            FROM colors c
            LEFT JOIN color_shades cs ON c.id = cs.color_id
            GROUP BY c.id, c.name, c.hex_code
            ORDER BY c.name
        `);

        res.json({
            success: true,
            data: {
                colors: colors.map(color => ({
                    ...color,
                    shades: JSON.parse(color.shades)
                }))
            }
        });
    } catch (error) {
        console.error('Get colors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching colors',
            error: error.message
        });
    }
};

/**
 * Get color shade by ID
 * GET /api/v1/mobile-app/colors/shade/:id
 */
const getColorShade = async (req, res) => {
    try {
        const { id } = req.params;

        const [shades] = await promisePool.query(`
            SELECT 
                cs.id,
                cs.shade,
                cs.display_name as displayName,
                cs.hex_code as hexCode,
                c.name as colorName,
                c.hex_code as baseHexCode
            FROM color_shades cs
            JOIN colors c ON cs.color_id = c.id
            WHERE cs.id = ?
        `, [id]);

        if (shades.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Color shade not found'
            });
        }

        res.json({
            success: true,
            data: {
                shade: shades[0]
            }
        });
    } catch (error) {
        console.error('Get color shade error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching color shade',
            error: error.message
        });
    }
};

module.exports = {
    getColors,
    getColorShade
};
