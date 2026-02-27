import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';

// Import routes
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import tenantRoutes from './routes/tenants.js';
import paymentRoutes from './routes/payments.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL, // For production
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database and then start server
const startServer = async () => {
    try {
        await initializeDatabase();

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/properties', propertyRoutes);
        app.use('/api/tenants', tenantRoutes);
        app.use('/api/payments', paymentRoutes);

        // Health check
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                message: 'Rential API is running',
                database: 'PostgreSQL'
            });
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something went wrong!', detail: err.message });
        });

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`📊 API endpoints available locally at http://localhost:${PORT}/api`);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
