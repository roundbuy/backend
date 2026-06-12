const { promisePool } = require('../../config/database');

exports.getShipments = async (req, res) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*, u.full_name as user_name, u.email as user_email,
                   c.name as carrier_name, r.service_name 
            FROM postage_shipments s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN shipping_carriers c ON s.carrier_id = c.id
            LEFT JOIN shipping_rates r ON s.rate_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND s.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [shipments] = await promisePool.query(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM postage_shipments WHERE 1=1`;
        const countParams = [];
        if (status) { countQuery += ` AND status = ?`; countParams.push(status); }
        
        const [countResult] = await promisePool.query(countQuery, countParams);

        res.json({
            success: true,
            data: shipments,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching admin shipments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCarriers = async (req, res) => {
    try {
        const [carriers] = await promisePool.query('SELECT * FROM shipping_carriers');
        res.json({ success: true, data: carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createCarrier = async (req, res) => {
    try {
        const { name, api_key, api_secret, api_url, is_active } = req.body;
        const [result] = await promisePool.query(
            `INSERT INTO shipping_carriers (name, api_key, api_secret, api_url, is_active) VALUES (?, ?, ?, ?, ?)`,
            [name, api_key, api_secret, api_url, is_active !== false]
        );
        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'create_carrier', 'shipping_carrier', result.insertId, JSON.stringify({ name })]
        );
        res.json({ success: true, message: 'Carrier created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateCarrier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, api_key, api_secret, api_url, is_active } = req.body;
        await promisePool.query(
            `UPDATE shipping_carriers SET name = ?, api_key = ?, api_secret = ?, api_url = ?, is_active = ? WHERE id = ?`,
            [name, api_key, api_secret, api_url, is_active, id]
        );
        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'update_carrier', 'shipping_carrier', id, JSON.stringify({ name, is_active })]
        );
        res.json({ success: true, message: 'Carrier updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteCarrier = async (req, res) => {
    try {
        await promisePool.query(`DELETE FROM shipping_carriers WHERE id = ?`, [req.params.id]);
        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'delete_carrier', 'shipping_carrier', req.params.id, null]
        );
        res.json({ success: true, message: 'Carrier deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRates = async (req, res) => {
    try {
        const [rates] = await promisePool.query(`
            SELECT r.*, c.name as carrier_name, z.name as zone_name
            FROM shipping_rates r
            JOIN shipping_carriers c ON r.carrier_id = c.id
            JOIN shipping_zones z ON r.zone_id = z.id
        `);
        res.json({ success: true, data: rates });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createRate = async (req, res) => {
    try {
        const { carrier_id, zone_id, service_name, min_weight_kg, max_weight_kg, base_rate, per_kg_rate, estimated_days } = req.body;
        const [result] = await promisePool.query(
            `INSERT INTO shipping_rates (carrier_id, zone_id, service_name, min_weight_kg, max_weight_kg, base_rate, per_kg_rate, estimated_days) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [carrier_id, zone_id, service_name, min_weight_kg, max_weight_kg, base_rate, per_kg_rate, estimated_days]
        );
        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'create_rate', 'shipping_rate', result.insertId, JSON.stringify({ carrier_id, service_name })]
        );
        res.json({ success: true, message: 'Rate created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteRate = async (req, res) => {
    try {
        await promisePool.query(`DELETE FROM shipping_rates WHERE id = ?`, [req.params.id]);
        await promisePool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'delete_rate', 'shipping_rate', req.params.id, null]
        );
        res.json({ success: true, message: 'Rate deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
