import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { get } from '../database.js';

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
    const credPath = process.env.FIREBASE_CREDENTIALS_PATH;

    if (credPath && existsSync(credPath)) {
        const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('✅ Firebase Admin SDK initialized from file');
    } else if (process.env.FIREBASE_CREDENTIALS_BASE64) {
        const decoded = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decoded);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('✅ Firebase Admin SDK initialized from env');
    } else {
        // Fallback for development if no credentials provided
        console.warn('⚠️ Firebase Admin SDK not fully configured. Using default/ADC or failing verification.');
    }
}

/**
 * Middleware: verify Firebase ID token and fetch local database user
 */
export async function authenticateFirebase(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token kerak' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.firebaseUser = decoded; // { uid, email, name, ... }

        // Map Firebase UID to local database user ID
        const user = get('SELECT id, firebase_uid, name, email, role FROM users WHERE firebase_uid = ?', [decoded.uid]);

        if (!user) {
            // User exists in Firebase but not in our DB yet.
            // This can happen if they just signed up via Google.
            // We'll let the /sync route handle it, or return 401 for other protected routes.
            if (req.path === '/sync') {
                return next();
            }
            return res.status(401).json({ error: 'Foydalanuvchi ma\'lumotlar bazasida topilmadi. Iltimos, qayta kiring.' });
        }

        req.user = user; // Set req.user to maintain compatibility with existing routes
        next();
    } catch (err) {
        console.error('Firebase token verify error:', err.message);
        return res.status(401).json({ error: 'Token noto\'g\'ri yoki muddati o\'tgan' });
    }
}

export default admin;
