const { promisePool: db } = require('../../config/database');

// ==================== WALLET MANAGEMENT ====================

/**
 * Get all user wallets with pagination and filtering
 */
exports.getWallets = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', min_balance = '', max_balance = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (min_balance) {
            whereConditions.push('w.balance >= ?');
            params.push(min_balance);
        }

        if (max_balance) {
            whereConditions.push('w.balance <= ?');
            params.push(max_balance);
        }

        if (status === 'active') {
            whereConditions.push('w.is_active = 1');
        } else if (status === 'inactive') {
            whereConditions.push('w.is_active = 0');
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const query = `
      SELECT w.*, u.full_name, u.email, u.username, u.profile_image
      FROM user_wallets w
      JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.balance DESC
      LIMIT ? OFFSET ?
    `;

        const [wallets] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
        const [total] = await db.query(`
      SELECT COUNT(*) as count 
      FROM user_wallets w 
      JOIN users u ON w.user_id = u.id 
      ${whereClause}
    `, params);

        res.json({
            success: true,
            data: {
                wallets,
                pagination: {
                    total: total[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total[0].count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get wallets error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wallets', error: error.message });
    }
};

/**
 * Get wallet details by wallet ID or User ID
 */
exports.getWalletDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch wallet info
        const [wallets] = await db.query(`
      SELECT w.*, u.full_name, u.email, u.username, u.phone, u.profile_image
      FROM user_wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `, [id]);

        if (wallets.length === 0) {
            return res.status(404).json({ success: false, message: 'Wallet not found' });
        }

        const wallet = wallets[0];

        // Fetch recent transactions
        const [transactions] = await db.query(`
      SELECT * FROM wallet_transactions
      WHERE wallet_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

        // Calculate aggregated stats
        const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_credited,
        SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_debited
      FROM wallet_transactions
      WHERE wallet_id = ?
    `, [id]);

        res.json({
            success: true,
            data: {
                wallet,
                recent_transactions: transactions,
                stats: stats[0]
            }
        });
    } catch (error) {
        console.error('Get wallet detail error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wallet details', error: error.message });
    }
};

/**
 * Get all wallet transactions (System-wide report)
 */
exports.getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type = '', category = '', status = '', search = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (type) {
            whereConditions.push('wt.transaction_type = ?');
            params.push(type);
        }

        if (category) {
            whereConditions.push('wt.category = ?');
            params.push(category);
        }

        if (status) {
            whereConditions.push('wt.status = ?');
            params.push(status);
        }

        if (search) {
            whereConditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR wt.reference_id LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const query = `
      SELECT wt.*, u.full_name as user_name, u.email as user_email
      FROM wallet_transactions wt
      JOIN users u ON wt.user_id = u.id
      ${whereClause}
      ORDER BY wt.created_at DESC
      LIMIT ? OFFSET ?
    `;

        const [transactions] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
        const [total] = await db.query(`
      SELECT COUNT(*) as count 
      FROM wallet_transactions wt 
      JOIN users u ON wt.user_id = u.id 
      ${whereClause}
    `, params);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total: total[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total[0].count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
};

/**
 * Get withdrawal requests
 */
exports.getWithdrawalRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (status) {
            whereConditions.push('wwr.status = ?');
            params.push(status);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const query = `
      SELECT wwr.*, u.full_name, u.email, u.phone, w.balance as current_wallet_balance
      FROM wallet_withdrawal_requests wwr
      JOIN users u ON wwr.user_id = u.id
      JOIN user_wallets w ON wwr.wallet_id = w.id
      ${whereClause}
      ORDER BY wwr.created_at DESC
      LIMIT ? OFFSET ?
    `;

        const [requests] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
        const [total] = await db.query(`SELECT COUNT(*) as count FROM wallet_withdrawal_requests wwr ${whereClause}`, params);

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    total: total[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total[0].count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get withdrawal requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch withdrawal requests', error: error.message });
    }
};

/**
 * Process withdrawal request (Approve/Reject)
 */
exports.processWithdrawal = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { status, admin_notes } = req.body; // status: 'completed' or 'rejected'
        const adminUserId = req.user.id; // Assuming auth middleware adds user to req

        if (!['completed', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be completed or rejected.' });
        }

        // Get request details
        const [requests] = await connection.query('SELECT * FROM wallet_withdrawal_requests WHERE id = ? FOR UPDATE', [id]);

        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        const request = requests[0];

        if (request.status !== 'pending' && request.status !== 'processing') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Request is already processed' });
        }

        // Update request status
        await connection.query(`
      UPDATE wallet_withdrawal_requests 
      SET status = ?, admin_notes = ?, processed_by = ?, processed_at = NOW() 
      WHERE id = ?
    `, [status, admin_notes, adminUserId, id]);

        if (status === 'completed') {
            // Create transaction record for the withdrawal completion (The deduction usually happens at request time or stays pending, 
            // but based on previous schema, let's assume the balance was deducted or reserved. 
            // If we need to finalize it, we just mark it done. 
            // However, usually 'withdrawal' transaction is created when money leaves the wallet.
            // Let's check schema: wallet_transactions table exists.
            // If the earlier logic deducted balance immediately, we might not need to do anything else on 'completed' other than updating status.
            // If balance is reserved, we finalize it.

            // For safety, let's check if the deduction transaction exists.
            // Assuming the withdrawal flow:
            // 1. User requests withdrawal -> Balance deducted, Transaction 'withdrawal' created with status 'pending'.
            // 2. Admin approves -> Transaction status 'completed'.
            // 3. Admin rejects -> Balance refunded, Transaction status 'cancelled' or new 'refund' transaction.

            // Let's update the related transaction if it exists
            await connection.query(`
        UPDATE wallet_transactions 
        SET status = 'completed' 
        WHERE reference_type = 'withdrawal_request' AND reference_id = ?
      `, [id]);

        } else if (status === 'rejected') {
            // Refund the user
            // 1. Get wallet
            const [wallets] = await connection.query('SELECT * FROM user_wallets WHERE id = ?', [request.wallet_id]);
            const wallet = wallets[0];

            const refundAmount = request.amount;
            const newBalance = parseFloat(wallet.balance) + parseFloat(refundAmount);

            // Update wallet balance
            await connection.query('UPDATE user_wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);

            // Create refund transaction
            await connection.query(`
        INSERT INTO wallet_transactions 
        (wallet_id, user_id, transaction_type, amount, balance_before, balance_after, category, reference_type, reference_id, description, status)
        VALUES (?, ?, 'credit', ?, ?, ?, 'refund', 'withdrawal_request', ?, ?, 'completed')
      `, [
                wallet.id,
                request.user_id,
                refundAmount,
                wallet.balance,
                newBalance,
                id,
                `Refund for rejected withdrawal request #${id}: ${admin_notes}`
            ]);

            // Update original transaction status to cancelled/failed
            await connection.query(`
        UPDATE wallet_transactions 
        SET status = 'failed' 
        WHERE reference_type = 'withdrawal_request' AND reference_id = ?
      `, [id]);
        }

        await connection.commit();
        res.json({ success: true, message: `Withdrawal request ${status} successfully` });
    } catch (error) {
        await connection.rollback();
        console.error('Process withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Failed to process withdrawal', error: error.message });
    } finally {
        connection.release();
    }
};
