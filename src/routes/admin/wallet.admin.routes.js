const express = require('express');
const router = express.Router();
const walletController = require('../../controllers/admin/wallet.admin.controller');
const { authorize } = require('../../middleware/auth.middleware');

// All routes here assume the user is already authenticated and is an admin/editor (checked in parent router)

// Wallets
router.get('/', walletController.getWallets);
router.get('/:id', walletController.getWalletDetail);

// Transactions
router.get('/transactions/all', walletController.getTransactions);

// Withdrawal Requests
router.get('/withdrawals/requests', walletController.getWithdrawalRequests);
router.patch('/withdrawals/:id/process', authorize('admin'), walletController.processWithdrawal); // Only admin can process withdrawals for security

module.exports = router;
