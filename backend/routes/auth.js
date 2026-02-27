import express from 'express';
import { get, run, all } from '../database.js';
import { authenticateFirebase } from '../middleware/firebase.js';

const router = express.Router();

/**
 * POST /api/auth/sync
 * Called after Firebase login/signup to sync user data with our database.
 * Creates user if not exists, returns user data.
 */
router.post('/sync', authenticateFirebase, async (req, res) => {
    const { firebase_uid, email, name, role, phone } = req.body;
    const uid = firebase_uid || req.firebaseUser.uid;
    const userEmail = email || req.firebaseUser.email;

    try {
        // Check if user exists by firebase_uid
        let user = await get('SELECT * FROM users WHERE firebase_uid = ?', [uid]);

        if (!user) {
            // Also check by email (in case user existed before firebase)
            user = await get('SELECT * FROM users WHERE email = ?', [userEmail]);
            if (user) {
                // Update existing user with firebase_uid
                await run('UPDATE users SET firebase_uid = ?, name = COALESCE(?, name) WHERE id = ?',
                    [uid, name, user.id]);
                user = await get('SELECT * FROM users WHERE id = ?', [user.id]);
            } else {
                // Create new user
                const result = await run(
                    'INSERT INTO users (firebase_uid, name, email, role, phone) VALUES (?, ?, ?, ?, ?) RETURNING id',
                    [uid, name || userEmail.split('@')[0], userEmail, role || 'owner', phone || '']
                );
                user = await get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
            }
        }

        // Return user without sensitive data
        if (user) {
            const { password: _, ...userOut } = user;
            res.json(userOut);
        } else {
            res.status(500).json({ error: 'Foydalanuvchi yaratilmadi' });
        }
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Foydalanuvchi sinxronizatsiyasida xatolik', detail: error.message });
    }
});

/**
 * GET /api/auth/profile
 * Get current user's profile
 */
router.get('/profile', authenticateFirebase, async (req, res) => {
    try {
        const user = await get('SELECT id, firebase_uid, name, email, role, phone, created_at FROM users WHERE firebase_uid = ?',
            [req.firebaseUser.uid]);

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Profil yuklanmadi' });
    }
});

/**
 * PUT /api/auth/profile
 * Update current user's profile
 */
router.put('/profile', authenticateFirebase, async (req, res) => {
    const { name, phone, role } = req.body;
    try {
        await run(
            'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), role = COALESCE(?, role) WHERE firebase_uid = ?',
            [name, phone, role, req.firebaseUser.uid]
        );
        const updated = await get('SELECT id, firebase_uid, name, email, role, phone FROM users WHERE firebase_uid = ?',
            [req.firebaseUser.uid]);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Profil yangilanmadi' });
    }
});

export default router;
