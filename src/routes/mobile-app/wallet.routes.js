const express = require('express');
const router = express.Router();
const walletController = require('../../controllers/mobile-app/wallet.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All wallet routes require authentication
router.use(authenticate);

// Get wallet
router.get('/', walletController.getWallet);

// Get transactions
router.get('/transactions', walletController.getTransactions);

// Initiate top-up
router.post('/topup', walletController.initiateTopup);

// Complete top-up (simulate payment success)
router.post('/topup/complete', walletController.completeTopup);

// Pay with wallet
router.post('/pay', walletController.payWithWallet);

// Request withdrawal
router.post('/withdraw', walletController.requestWithdrawal);

module.exports = router;
