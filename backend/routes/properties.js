import express from 'express';
import { body, validationResult } from 'express-validator';
import { get, run, all } from '../database.js';
import { authenticateFirebase } from '../middleware/firebase.js';

const router = express.Router();

// Get all properties for authenticated user
router.get('/', authenticateFirebase, async (req, res) => {
    try {
        const properties = await all('SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(properties);
    } catch (error) {
        console.error('Fetch properties error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// Get single property
router.get('/:id', authenticateFirebase, async (req, res) => {
    try {
        const property = await get('SELECT * FROM properties WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(property);
    } catch (error) {
        console.error('Fetch property error:', error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
});

// Create property
router.post(
    '/',
    authenticateFirebase,
    [
        body('name').trim().notEmpty().withMessage('Property name is required'),
        body('address').trim().notEmpty().withMessage('Address is required'),
        body('type').trim().notEmpty().withMessage('Property type is required'),
        body('rooms').isInt({ min: 1 }).withMessage('Rooms must be at least 1'),
        body('monthly_rent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, address, type, rooms, monthly_rent, status } = req.body;

        try {
            // Added RETURNING id for Postgres compatibility
            const result = await run(
                'INSERT INTO properties (user_id, name, address, type, rooms, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
                [req.user.id, name, address, type, rooms, monthly_rent, status || 'available']
            );

            const propertyId = result.lastInsertRowid;
            const property = await get('SELECT * FROM properties WHERE id = ?', [propertyId]);
            res.status(201).json(property);
        } catch (error) {
            console.error('Create property error:', error);
            res.status(500).json({ error: 'Failed to create property' });
        }
    }
);

// Update property
router.patch('/:id', authenticateFirebase, async (req, res) => {
    const updates = req.body;
    const allowedUpdates = ['name', 'address', 'type', 'rooms', 'monthly_rent', 'status'];

    try {
        const property = await get('SELECT * FROM properties WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Build dynamically the UPDATE query
        let sql = 'UPDATE properties SET ';
        const params = [];
        const updateParts = [];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key) && updates[key] !== undefined) {
                updateParts.push(`${key} = ?`);
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

        const updated = await get('SELECT * FROM properties WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

// Delete property
router.delete('/:id', authenticateFirebase, async (req, res) => {
    try {
        const property = await get('SELECT * FROM properties WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        await run('DELETE FROM properties WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

export default router;
