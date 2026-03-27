import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import crowdRoutes from './routes/crowdRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import notificationRoutes from './routes/notificationRoutes';
import teacherRoutes from './routes/teacherRoutes';
import adminRoutes from './routes/adminRoutes';
import busRoutes from './routes/busRoutes';
import departmentRoutes from './routes/departmentRoutes';
import eventRoutes from './routes/eventRoutes';
import campusRoutes from './routes/campusRoutes';
import realtimeRoutes from './routes/realtimeRoutes';

// ── Env validation ──
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'] as const;
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ SMTP env vars missing. OTP email delivery will be skipped outside production setup.');
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary env vars missing. Profile photo uploads are disabled.');
}

void connectDB().catch((error) => {
    console.error('Database connection failed during startup:', error?.message || error);
});

const app = express();

const sanitizeValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
            value[i] = sanitizeValue(value[i]);
        }
        return value;
    }

    if (value && typeof value === 'object') {
        const target = value as Record<string, unknown>;
        for (const key of Object.keys(target)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete target[key];
                continue;
            }
            target[key] = sanitizeValue(target[key]);
        }
        return target;
    }

    return value;
};

// Required behind Render/other proxies so rate limiter and client IPs work correctly.
app.set('trust proxy', 1);

// ── Security middleware ──
app.use(helmet());                                          // Security headers
app.use(express.json({ limit: '1mb' }));                    // Body size limit
app.use((req, _res, next) => {
    sanitizeValue(req.body);
    sanitizeValue(req.query);
    sanitizeValue(req.params);
    next();
});

// CORS — only allow known origins
const parseAllowedOrigins = (): string[] => {
    const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const explicit = [process.env.FRONTEND_URL].filter(Boolean) as string[];
    const csv = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    return [...new Set([...defaults, ...explicit, ...csv])];
};

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// ── Rate limiting ──
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 200,                   // 200 requests per window
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 auth attempts per window (strict)
    message: { message: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(generalLimiter);

// Routes — auth routes get the stricter limiter
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/realtime', realtimeRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'SyntaxError API — Smart Campus Management System (ADTU)' });
});

app.get('/api', (_req, res) => {
    res.json({ message: 'SyntaxError API is running', status: 'ok' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 5000;
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} across all interfaces (0.0.0.0)`));
}

export default app;
