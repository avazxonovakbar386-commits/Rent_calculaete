import express from 'express';
import { body, validationResult } from 'express-validator';
import { get, run, all, isPostgres } from '../database.js';
import { authenticateFirebase } from '../middleware/firebase.js';

const router = express.Router();

// Get all payments for authenticated user
router.get('/', authenticateFirebase, async (req, res) => {
    try {
        const payments = await all(`
      SELECT p.*, t.name as tenant_name, pr.name as property_name
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN properties pr ON p.property_id = pr.id
      WHERE p.user_id = ? 
      ORDER BY p.payment_date DESC
    `, [req.user.id]);

        res.json(payments);
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get payments by tenant
router.get('/tenant/:tenantId', authenticateFirebase, async (req, res) => {
    try {
        const payments = await all(`
      SELECT p.*, t.name as tenant_name, pr.name as property_name
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN properties pr ON p.property_id = pr.id
      WHERE p.tenant_id = ? AND p.user_id = ? 
      ORDER BY p.payment_date DESC
    `, [req.params.tenantId, req.user.id]);

        res.json(payments);
    } catch (error) {
        console.error('Fetch tenant payments error:', error);
        res.status(500).json({ error: 'Failed to fetch tenant payments' });
    }
});

// Create payment
router.post(
    '/',
    authenticateFirebase,
    [
        body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
        body('payment_date').optional().notEmpty().withMessage('Payment date is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { tenant_id, tenant, property_id, property, amount, payment_date, date, payment_method, status, notes, note } = req.body;

        const finalTenantId = tenant_id || tenant;
        const finalPropertyId = property_id || property;
        const finalDate = payment_date || date || new Date().toISOString().split('T')[0];
        const finalNotes = notes || note;

        if (!finalTenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        try {
            const result = await run(
                'INSERT INTO payments (user_id, tenant_id, property_id, amount, payment_date, payment_method, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
                [req.user.id, finalTenantId, finalPropertyId || null, amount, finalDate, payment_method || 'cash', status || 'completed', finalNotes || null]
            );

            const payment = await get(`
        SELECT p.*, t.name as tenant_name, pr.name as property_name
        FROM payments p
        LEFT JOIN tenants t ON p.tenant_id = t.id
        LEFT JOIN properties pr ON p.property_id = pr.id
        WHERE p.id = ?
      `, [result.lastInsertRowid]);

            res.status(201).json(payment);
        } catch (error) {
            console.error('Create payment error:', error);
            res.status(500).json({ error: 'Failed to create payment' });
        }
    }
);

// Get analytics/dashboard data
router.get('/analytics/dashboard', authenticateFirebase, async (req, res) => {
    try {
        // Total properties
        const totalPropertiesResult = await get('SELECT COUNT(*) as count FROM properties WHERE user_id = ?', [req.user.id]);
        const totalProperties = totalPropertiesResult ? parseInt(totalPropertiesResult.count) : 0;

        // Total tenants
        const totalTenantsResult = await get('SELECT COUNT(*) as count FROM tenants WHERE user_id = ? AND status = ?', [req.user.id, 'active']);
        const totalTenants = totalTenantsResult ? parseInt(totalTenantsResult.count) : 0;

        // Total monthly revenue
        const monthlyRevenueResult = await get('SELECT SUM(monthly_rent) as total FROM tenants WHERE user_id = ? AND status = ?', [req.user.id, 'active']);
        const monthlyRevenue = monthlyRevenueResult && monthlyRevenueResult.total ? parseFloat(monthlyRevenueResult.total) : 0;

        // Recent payments (last 30 days)
        const recentPaymentsQuery = isPostgres
            ? `SELECT SUM(amount) as total FROM payments WHERE user_id = ? AND payment_date >= (CURRENT_DATE - INTERVAL '30 days')::text`
            : `SELECT SUM(amount) as total FROM payments WHERE user_id = ? AND payment_date >= date('now', '-30 days')`;

        const recentPaymentsResult = await get(recentPaymentsQuery, [req.user.id]);
        const recentPayments = recentPaymentsResult && recentPaymentsResult.total ? parseFloat(recentPaymentsResult.total) : 0;

        // Occupancy rate
        const occupiedPropertiesResult = await get('SELECT COUNT(*) as count FROM properties WHERE user_id = ? AND status = ?', [req.user.id, 'occupied']);
        const occupiedProperties = occupiedPropertiesResult ? parseInt(occupiedPropertiesResult.count) : 0;
        const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : 0;

        res.json({
            totalProperties,
            totalTenants,
            monthlyRevenue,
            recentPayments,
            occupancyRate
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Update payment
router.patch('/:id', authenticateFirebase, async (req, res) => {
    const updates = req.body;
    const allowedUpdates = ['tenant_id', 'tenant', 'property_id', 'property', 'amount', 'payment_date', 'date', 'payment_method', 'status', 'notes', 'note'];

    try {
        const payment = await get('SELECT * FROM payments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Build dynamically the UPDATE query
        let sql = 'UPDATE payments SET ';
        const params = [];
        const updateParts = [];

        // Mapping frontend fields to backend columns
        const fieldMap = {
            tenant: 'tenant_id',
            property: 'property_id',
            date: 'payment_date',
            note: 'notes'
        };

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key) && updates[key] !== undefined) {
                const column = fieldMap[key] || key;
                updateParts.push(`${column} = ?`);
                params.push(updates[key]);
            }
        });

        if (updateParts.length === 0) {
            return res.status(400).json({ error: 'No valid updates provided' });
        }

        sql += updateParts.join(', ');
        sql += ' WHERE id = ? AND user_id = ?';
        params.push(req.params.id, req.user.id);

        await run(sql, params);

        const updated = await get(`
            SELECT p.*, t.name as tenant_name, pr.name as property_name
            FROM payments p
            LEFT JOIN tenants t ON p.tenant_id = t.id
            LEFT JOIN properties pr ON p.property_id = pr.id
            WHERE p.id = ?
        `, [req.params.id]);

        res.json(updated);
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// Delete payment
router.delete('/:id', authenticateFirebase, async (req, res) => {
    try {
        const payment = await get('SELECT * FROM payments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        await run('DELETE FROM payments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ error: 'Failed to delete payment' });
    }
});

export default router;
