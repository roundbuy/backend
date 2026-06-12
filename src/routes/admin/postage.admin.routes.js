const express = require('express');
const router = express.Router();
const postageAdminController = require('../../controllers/admin/postage.admin.controller');
const { authenticateAdmin } = require('../../middleware/admin.middleware');

// --- SHIPMENTS ---
router.get('/shipments', authenticateAdmin, postageAdminController.getShipments);

// --- CARRIERS ---
router.get('/carriers', authenticateAdmin, postageAdminController.getCarriers);
router.post('/carriers', authenticateAdmin, postageAdminController.createCarrier);
router.put('/carriers/:id', authenticateAdmin, postageAdminController.updateCarrier);
router.delete('/carriers/:id', authenticateAdmin, postageAdminController.deleteCarrier);

// --- RATES ---
router.get('/rates', authenticateAdmin, postageAdminController.getRates);
router.post('/rates', authenticateAdmin, postageAdminController.createRate);
router.delete('/rates/:id', authenticateAdmin, postageAdminController.deleteRate);

module.exports = router;
