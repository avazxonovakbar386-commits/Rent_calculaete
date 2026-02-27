import express from 'express';
import { body, validationResult } from 'express-validator';
import { get, run, all } from '../database.js';
import { authenticateFirebase } from '../middleware/firebase.js';

const router = express.Router();

// Get all tenants for authenticated user
router.get('/', authenticateFirebase, async (req, res) => {
    try {
        const tenants = await all(`
      SELECT t.*, p.name as property_name 
      FROM tenants t
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE t.user_id = ? 
      ORDER BY t.created_at DESC
    `, [req.user.id]);

        res.json(tenants);
    } catch (error) {
        console.error('Fetch tenants error:', error);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
});

// Get single tenant
router.get('/:id', authenticateFirebase, async (req, res) => {
    try {
        const tenant = await get(`
      SELECT t.*, p.name as property_name 
      FROM tenants t
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE t.id = ? AND t.user_id = ?
    `, [req.params.id, req.user.id]);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.json(tenant);
    } catch (error) {
        console.error('Fetch tenant error:', error);
        res.status(500).json({ error: 'Failed to fetch tenant' });
    }
});

// Create tenant
router.post(
    '/',
    authenticateFirebase,
    [
        body('name').trim().notEmpty().withMessage('Tenant name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').trim().notEmpty().withMessage('Phone is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, property_id, move_in_date, move_out_date, monthly_rent, status, is_paid } = req.body;

        try {
            const result = await run(
                'INSERT INTO tenants (user_id, property_id, name, email, phone, move_in_date, move_out_date, monthly_rent, status, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
                [req.user.id, property_id || null, name, email, phone, move_in_date || null, move_out_date || null, monthly_rent || null, status || 'active', is_paid ? 1 : 0]
            );

            const tenant = await get(`
        SELECT t.*, p.name as property_name 
        FROM tenants t
        LEFT JOIN properties p ON t.property_id = p.id
        WHERE t.id = ?
      `, [result.lastInsertRowid]);

            res.status(201).json(tenant);
        } catch (error) {
            console.error('Create tenant error:', error);
            res.status(500).json({ error: 'Failed to create tenant' });
        }
    }
);

// Update tenant
router.patch('/:id', authenticateFirebase, async (req, res) => {
    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'phone', 'property_id', 'move_in_date', 'move_out_date', 'monthly_rent', 'status', 'is_paid'];

    try {
        const tenant = await get('SELECT * FROM tenants WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Build dynamically the UPDATE query
        let sql = 'UPDATE tenants SET ';
        const params = [];
        const updateParts = [];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key) && updates[key] !== undefined) {
                updateParts.push(`${key} = ?`);
                params.push(key === 'is_paid' ? (updates[key] ? 1 : 0) : updates[key]);
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
      SELECT t.*, p.name as property_name 
      FROM tenants t
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE t.id = ?
    `, [req.params.id]);

        res.json(updated);
    } catch (error) {
        console.error('Update tenant error:', error);
        res.status(500).json({ error: 'Failed to update tenant' });
    }
});

// Delete tenant
router.delete('/:id', authenticateFirebase, async (req, res) => {
    try {
        const tenant = await get('SELECT * FROM tenants WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        await run('DELETE FROM tenants WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Delete tenant error:', error);
        res.status(500).json({ error: 'Failed to delete tenant' });
    }
});

export default router;
