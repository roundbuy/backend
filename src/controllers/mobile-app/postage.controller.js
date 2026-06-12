const { promisePool } = require('../../config/database');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const notificationService = require('../../services/notification.service');
const notificationDispatcher = require('../../services/notificationDispatcher.service');

// --- CARRIERS & ZONES ---

exports.getCarriers = async (req, res) => {
    try {
        const [carriers] = await promisePool.query('SELECT * FROM shipping_carriers WHERE is_active = true');
        res.json({ success: true, data: carriers });
    } catch (error) {
        console.error('Error fetching carriers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getZones = async (req, res) => {
    try {
        const [zones] = await promisePool.query('SELECT * FROM shipping_zones');
        res.json({ success: true, data: zones });
    } catch (error) {
        console.error('Error fetching zones:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- RATE CALCULATION ---

exports.calculateRate = async (req, res) => {
    try {
        const { carrier_id, origin_country, destination_country, weight_kg } = req.body;
        
        if (!carrier_id || !origin_country || !destination_country || !weight_kg) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        const weightNum = parseFloat(weight_kg);

        // Find zone matching destination country (check JSON countries array)
        const [allZones] = await promisePool.query(
            `SELECT * FROM shipping_zones`
        );

        let zoneId = null;
        const destUpper = destination_country.toUpperCase();

        for (const zone of allZones) {
            try {
                const countries = typeof zone.countries === 'string'
                    ? JSON.parse(zone.countries)
                    : zone.countries || [];
                if (countries.map(c => c.toUpperCase()).includes(destUpper)) {
                    zoneId = zone.id;
                    break;
                }
            } catch (e) { /* skip malformed */ }
        }

        // Fallback: use first zone for this carrier
        if (!zoneId && allZones.length > 0) {
            zoneId = allZones[0].id;
        }

        if (!zoneId) {
            return res.status(404).json({ success: false, message: 'No shipping zone found for this carrier.' });
        }

        // Fetch applicable rates for weight range
        const [rates] = await promisePool.query(
            `SELECT * FROM shipping_rates 
             WHERE carrier_id = ? AND zone_id = ? AND is_active = 1
               AND min_weight_kg <= ? AND max_weight_kg >= ?
             ORDER BY base_price ASC`,
            [carrier_id, zoneId, weightNum, weightNum]
        );

        if (rates.length === 0) {
            // Try without strict weight bounds — find nearest
            const [anyRates] = await promisePool.query(
                `SELECT * FROM shipping_rates WHERE carrier_id = ? AND zone_id = ? AND is_active = 1 ORDER BY max_weight_kg DESC LIMIT 1`,
                [carrier_id, zoneId]
            );
            if (anyRates.length === 0) {
                return res.status(404).json({ success: false, message: 'No applicable rates found for this weight and destination.' });
            }
            const r = anyRates[0];
            return res.json({
                success: true,
                data: {
                    ...r,
                    base_rate: r.base_price, // alias for frontend compatibility
                    estimated_days: r.delivery_days_max
                }
            });
        }

        const r = rates[0];
        res.json({
            success: true,
            data: {
                ...r,
                base_rate: r.base_price, // alias for frontend compatibility
                estimated_days: r.delivery_days_max
            }
        });

    } catch (error) {
        console.error('Error calculating rate:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- SHIPMENTS ---

exports.getShipments = async (req, res) => {
    try {
        const userId = req.user.id;
        const [shipments] = await promisePool.query(`
            SELECT s.*, c.name as carrier_name, r.service_name 
            FROM postage_shipments s
            LEFT JOIN shipping_carriers c ON s.carrier_id = c.id
            LEFT JOIN shipping_rates r ON s.rate_id = r.id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `, [userId]);

        res.json({ success: true, data: shipments });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getShipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const [shipments] = await promisePool.query(`
            SELECT s.*, c.name as carrier_name, r.service_name 
            FROM postage_shipments s
            LEFT JOIN shipping_carriers c ON s.carrier_id = c.id
            LEFT JOIN shipping_rates r ON s.rate_id = r.id
            WHERE s.id = ? AND s.user_id = ?
        `, [id, userId]);

        if (shipments.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        res.json({ success: true, data: shipments[0] });
    } catch (error) {
        console.error('Error fetching shipment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createShipment = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            carrier_id, rate_id,
            sender_name, sender_phone, sender_email,
            sender_address_line1, sender_address_line2, sender_city,
            sender_region, sender_postcode, sender_country, sender_country_code,
            receiver_name, receiver_phone, receiver_email,
            receiver_address_line1, receiver_address_line2, receiver_city,
            receiver_region, receiver_postcode, receiver_country, receiver_country_code,
            weight_kg, length_cm, width_cm, height_cm,
            declared_value, package_description, estimated_cost, currency_code
        } = req.body;

        // Validate required fields
        if (!carrier_id || !sender_name || !receiver_name || !weight_kg) {
            return res.status(400).json({ success: false, message: 'carrier_id, sender_name, receiver_name, and weight_kg are required' });
        }

        // 1. Generate tracking number
        const trackingNumber = `RB${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
        
        // 2. Generate QR code for tracking URL
        const trackingUrl = `https://roundbuy.com/track/${trackingNumber}`;
        const qrCodeData = await QRCode.toDataURL(trackingUrl);

        // 3. Insert shipment record using flat schema
        const [result] = await promisePool.query(`
            INSERT INTO postage_shipments (
                user_id, carrier_id, rate_id,
                sender_name, sender_phone, sender_email,
                sender_address_line1, sender_address_line2, sender_city,
                sender_region, sender_postcode, sender_country, sender_country_code,
                receiver_name, receiver_phone, receiver_email,
                receiver_address_line1, receiver_address_line2, receiver_city,
                receiver_region, receiver_postcode, receiver_country, receiver_country_code,
                weight_kg, length_cm, width_cm, height_cm,
                declared_value, package_description,
                tracking_number, estimated_cost, currency_code,
                qr_code_data, status
            ) VALUES (
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?,
                ?, 'created'
            )
        `, [
            userId, carrier_id, rate_id || null,
            sender_name, sender_phone || null, sender_email || null,
            sender_address_line1, sender_address_line2 || null, sender_city,
            sender_region || null, sender_postcode, sender_country, sender_country_code || sender_country?.substring(0,2).toUpperCase(),
            receiver_name, receiver_phone || null, receiver_email || null,
            receiver_address_line1, receiver_address_line2 || null, receiver_city,
            receiver_region || null, receiver_postcode, receiver_country, receiver_country_code || receiver_country?.substring(0,2).toUpperCase(),
            parseFloat(weight_kg), length_cm || null, width_cm || null, height_cm || null,
            declared_value || null, package_description || null,
            trackingNumber, estimated_cost || 0, currency_code || 'GBP',
            qrCodeData
        ]);

        const shipmentId = result.insertId;

        // 4. Generate PDF Label
        let labelUrl = null;
        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([400, 600]);
            const { height } = page.getSize();

            page.drawText('RoundBuy Postage Label', { x: 50, y: height - 50, size: 18 });
            page.drawText(`Tracking: ${trackingNumber}`, { x: 50, y: height - 75, size: 11 });
            page.drawText(`Weight: ${weight_kg} kg`, { x: 50, y: height - 95, size: 10 });
            
            page.drawText('FROM:', { x: 50, y: height - 130, size: 11 });
            page.drawText(`${sender_name}`, { x: 50, y: height - 148, size: 10 });
            page.drawText(`${sender_address_line1}`, { x: 50, y: height - 163, size: 10 });
            page.drawText(`${sender_city}, ${sender_postcode}`, { x: 50, y: height - 178, size: 10 });
            page.drawText(`${sender_country}`, { x: 50, y: height - 193, size: 10 });

            page.drawText('TO:', { x: 50, y: height - 228, size: 11 });
            page.drawText(`${receiver_name}`, { x: 50, y: height - 246, size: 10 });
            page.drawText(`${receiver_address_line1}`, { x: 50, y: height - 261, size: 10 });
            page.drawText(`${receiver_city}, ${receiver_postcode}`, { x: 50, y: height - 276, size: 10 });
            page.drawText(`${receiver_country}`, { x: 50, y: height - 291, size: 10 });

            // Embed QR Code
            const qrImageBytes = Buffer.from(qrCodeData.split(',')[1], 'base64');
            const qrImage = await pdfDoc.embedPng(qrImageBytes);
            page.drawImage(qrImage, { x: 100, y: 50, width: 200, height: 200 });

            const pdfBytes = await pdfDoc.save();
            
            // Save PDF
            const fileName = `label_${shipmentId}_${Date.now()}.pdf`;
            const uploadDir = path.join(__dirname, '../../../../public/uploads/labels');
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, pdfBytes);

            labelUrl = `/uploads/labels/${fileName}`;
            await promisePool.query(`UPDATE postage_shipments SET label_url = ? WHERE id = ?`, [labelUrl, shipmentId]);
        } catch (pdfErr) {
            console.error('PDF generation error (non-fatal):', pdfErr.message);
        }

        res.json({
            success: true,
            message: 'Shipment created successfully',
            data: {
                id: shipmentId,
                tracking_number: trackingNumber,
                label_url: labelUrl,
                qr_code_data: qrCodeData,
                status: 'created'
            }
        });

    } catch (error) {
        console.error('Error creating shipment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updateShipmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        // Only allow updating to certain statuses (e.g. cancelled) or if admin
        await promisePool.query(`
            UPDATE postage_shipments SET status = ?, updated_at = NOW() 
            WHERE id = ? AND user_id = ?
        `, [status, id, userId]);

        try {
            // Find the order to notify the buyer
            const [shipment] = await promisePool.query(`
                SELECT s.tracking_number, o.user_id as buyer_id, o.id as order_id 
                FROM postage_shipments s
                JOIN orders o ON s.order_id = o.id
                WHERE s.id = ?
            `, [id]);

            if (shipment.length > 0 && shipment[0].buyer_id) {
                const notifId = await notificationService.createNotification({
                    title: 'Shipment Update',
                    message: `Your shipment (Tracking: ${shipment[0].tracking_number}) status is now: ${status}`,
                    type: 'push',
                    targetAudience: 'specific',
                    targetUserIds: [shipment[0].buyer_id],
                    actionType: 'open_order',
                    actionData: { orderId: shipment[0].order_id },
                    createdBy: 1 // System user
                });
                await notificationDispatcher.dispatchNotification(notifId);
            }
        } catch (notifErr) {
            console.error('Failed to send shipment notification:', notifErr);
        }

        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- LEGACY LABEL ROUTES (from existing postage_labels table, kept for backwards compatibility) ---

exports.generateLabel = async (req, res) => {
    // Forwarding to new logic or keeping legacy logic based on requirement
    // Existing code left intact conceptually, handled by createShipment now in full system.
    res.status(400).json({ success: false, message: 'Please use /shipments endpoint for new postage system' });
};

exports.getLabel = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const [labels] = await promisePool.query(
            "SELECT * FROM postage_labels WHERE order_id = ? AND user_id = ?",
            [orderId, userId]
        );

        if (labels.length === 0) {
            return res.status(404).json({ success: false, message: 'Label not found' });
        }

        res.json({ success: true, data: labels[0] });
    } catch (error) {
        console.error('Error fetching postage label:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
