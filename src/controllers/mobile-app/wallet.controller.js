const { promisePool } = require('../../config/database');

/**
 * Get user's wallet
 * GET /api/v1/mobile-app/wallet
 */
const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get or create wallet
        let [wallets] = await promisePool.query(
            'SELECT * FROM user_wallets WHERE user_id = ?',
            [userId]
        );

        // Create wallet if doesn't exist
        if (wallets.length === 0) {
            await promisePool.query(
                'INSERT INTO user_wallets (user_id, balance, currency) VALUES (?, 0.00, ?)',
                [userId, 'GBP']
            );
            [wallets] = await promisePool.query(
                'SELECT * FROM user_wallets WHERE user_id = ?',
                [userId]
            );
        }

        const wallet = wallets[0];

        // Get recent transactions
        const [recentTransactions] = await promisePool.query(
            `SELECT * FROM wallet_transactions 
       WHERE wallet_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
            [wallet.id]
        );

        res.json({
            success: true,
            data: {
                wallet: {
                    id: wallet.id,
                    balance: parseFloat(wallet.balance),
                    currency: wallet.currency,
                    is_active: wallet.is_active
                },
                recent_transactions: recentTransactions
            }
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet',
            error: error.message
        });
    }
};

/**
 * Get wallet transactions
 * GET /api/v1/mobile-app/wallet/transactions
 */
const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type, category } = req.query;

        // Get wallet
        const [wallets] = await promisePool.query(
            'SELECT id FROM user_wallets WHERE user_id = ?',
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const walletId = wallets[0].id;

        // Build query
        let whereClause = 'WHERE wallet_id = ?';
        const params = [walletId];

        if (type) {
            whereClause += ' AND transaction_type = ?';
            params.push(type);
        }

        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        const offset = (page - 1) * limit;

        // Get transactions
        const [transactions] = await promisePool.query(
            `SELECT * FROM wallet_transactions 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        // Get total count
        const [countResult] = await promisePool.query(
            `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
            params
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    total_pages: totalPages
                }
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions',
            error: error.message
        });
    }
};

/**
 * Initiate wallet top-up
 * POST /api/v1/mobile-app/wallet/topup
 */
const initiateTopup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, payment_method = 'card' } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Get wallet
        const [wallets] = await promisePool.query(
            'SELECT id FROM user_wallets WHERE user_id = ?',
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const walletId = wallets[0].id;

        // Create top-up request
        const [result] = await promisePool.query(
            `INSERT INTO wallet_topup_requests 
       (user_id, wallet_id, amount, payment_method, status)
       VALUES (?, ?, ?, ?, 'pending')`,
            [userId, walletId, amount, payment_method]
        );

        const topupRequestId = result.insertId;

        // In a real app, you would integrate with payment gateway here
        // For now, we'll simulate immediate success

        res.json({
            success: true,
            message: 'Top-up request created',
            data: {
                topup_request_id: topupRequestId,
                amount: parseFloat(amount),
                payment_method,
                status: 'pending',
                // In production, return payment_url from gateway
                payment_url: null
            }
        });
    } catch (error) {
        console.error('Initiate topup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initiating top-up',
            error: error.message
        });
    }
};

/**
 * Complete wallet top-up (simulate payment success)
 * POST /api/v1/mobile-app/wallet/topup/complete
 */
const completeTopup = async (req, res) => {
    const connection = await promisePool.getConnection();

    try {
        const userId = req.user.id;
        const { topup_request_id } = req.body;

        await connection.beginTransaction();

        // Get top-up request
        const [requests] = await connection.query(
            'SELECT * FROM wallet_topup_requests WHERE id = ? AND user_id = ?',
            [topup_request_id, userId]
        );

        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Top-up request not found'
            });
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Top-up request already processed'
            });
        }

        // Get wallet
        const [wallets] = await connection.query(
            'SELECT * FROM user_wallets WHERE id = ? FOR UPDATE',
            [request.wallet_id]
        );

        const wallet = wallets[0];
        const balanceBefore = parseFloat(wallet.balance);
        const amount = parseFloat(request.amount);
        const balanceAfter = balanceBefore + amount;

        // Update wallet balance
        await connection.query(
            'UPDATE user_wallets SET balance = ? WHERE id = ?',
            [balanceAfter, wallet.id]
        );

        // Create transaction record
        await connection.query(
            `INSERT INTO wallet_transactions 
       (wallet_id, user_id, transaction_type, amount, balance_before, balance_after, 
        category, payment_method, description, status)
       VALUES (?, ?, 'credit', ?, ?, ?, 'topup', ?, ?, 'completed')`,
            [
                wallet.id,
                userId,
                amount,
                balanceBefore,
                balanceAfter,
                request.payment_method,
                `Wallet top-up of ${wallet.currency} ${amount}`
            ]
        );

        // Update top-up request
        await connection.query(
            `UPDATE wallet_topup_requests 
       SET status = 'completed', completed_at = NOW() 
       WHERE id = ?`,
            [topup_request_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Top-up completed successfully',
            data: {
                new_balance: balanceAfter,
                amount_added: amount,
                currency: wallet.currency
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Complete topup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing top-up',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

/**
 * Pay using wallet
 * POST /api/v1/mobile-app/wallet/pay
 */
const payWithWallet = async (req, res) => {
    const connection = await promisePool.getConnection();

    try {
        const userId = req.user.id;
        const { amount, reference_type, reference_id, description } = req.body;

        // Validate
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        await connection.beginTransaction();

        // Get wallet with lock
        const [wallets] = await connection.query(
            'SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const wallet = wallets[0];
        const balanceBefore = parseFloat(wallet.balance);
        const paymentAmount = parseFloat(amount);

        // Check sufficient balance
        if (balanceBefore < paymentAmount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance',
                data: {
                    required: paymentAmount,
                    available: balanceBefore,
                    shortfall: paymentAmount - balanceBefore
                }
            });
        }

        const balanceAfter = balanceBefore - paymentAmount;

        // Update wallet balance
        await connection.query(
            'UPDATE user_wallets SET balance = ? WHERE id = ?',
            [balanceAfter, wallet.id]
        );

        // Create transaction record
        const [result] = await connection.query(
            `INSERT INTO wallet_transactions 
       (wallet_id, user_id, transaction_type, amount, balance_before, balance_after,
        category, reference_type, reference_id, description, status)
       VALUES (?, ?, 'debit', ?, ?, ?, 'payment', ?, ?, ?, 'completed')`,
            [
                wallet.id,
                userId,
                paymentAmount,
                balanceBefore,
                balanceAfter,
                reference_type,
                reference_id,
                description || `Payment for ${reference_type}`
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Payment successful',
            data: {
                transaction_id: result.insertId,
                amount_paid: paymentAmount,
                new_balance: balanceAfter,
                currency: wallet.currency
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Pay with wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

/**
 * Request withdrawal
 * POST /api/v1/mobile-app/wallet/withdraw
 */
const requestWithdrawal = async (req, res) => {
    const connection = await promisePool.getConnection();

    try {
        const userId = req.user.id;
        const { amount, withdrawal_method, bank_account_details } = req.body;

        // Validate
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        if (!withdrawal_method) {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal method is required'
            });
        }

        await connection.beginTransaction();

        // Get wallet
        const [wallets] = await connection.query(
            'SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const wallet = wallets[0];
        const balance = parseFloat(wallet.balance);
        const withdrawalAmount = parseFloat(amount);

        // Check sufficient balance
        if (balance < withdrawalAmount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
                data: {
                    required: withdrawalAmount,
                    available: balance
                }
            });
        }

        // Create withdrawal request
        const [result] = await connection.query(
            `INSERT INTO wallet_withdrawal_requests 
       (user_id, wallet_id, amount, withdrawal_method, bank_account_details, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
            [
                userId,
                wallet.id,
                withdrawalAmount,
                withdrawal_method,
                JSON.stringify(bank_account_details || {})
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: {
                withdrawal_request_id: result.insertId,
                amount: withdrawalAmount,
                status: 'pending',
                note: 'Your withdrawal request will be processed within 1-3 business days'
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Request withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting withdrawal',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    getWallet,
    getTransactions,
    initiateTopup,
    completeTopup,
    payWithWallet,
    requestWithdrawal
};
