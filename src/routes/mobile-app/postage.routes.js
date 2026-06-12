const express = require('express');
const router = express.Router();
const postageController = require('../../controllers/mobile-app/postage.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// --- REFERENCE DATA ---
router.get('/carriers', authenticate, postageController.getCarriers);
router.get('/zones', authenticate, postageController.getZones);

// --- CALCULATION ---
router.post('/calculate', authenticate, postageController.calculateRate);

// --- SHIPMENTS ---
router.get('/shipments', authenticate, postageController.getShipments);
router.post('/shipments', authenticate, postageController.createShipment);
router.get('/shipments/:id', authenticate, postageController.getShipmentById);
router.put('/shipments/:id/status', authenticate, postageController.updateShipmentStatus);

// --- LEGACY LABEL (For compatibility) ---
router.post('/generate', authenticate, postageController.generateLabel);
router.get('/label/:orderId', authenticate, postageController.getLabel);

module.exports = router;
