const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Import added
const authRoutes = require('../routes/authRoutes');
const db = require('./db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { verifyToken } = require('../middleware/auth');

// Create a separate app instance to isolate rate limit state per test file
const app = express();
app.set('trust proxy', 1); // IMPORTANT: Enable for rate limiter with supertest
app.use(express.json());

// Mock Environment
process.env.JWT_SECRET = 'test_secret';

// REPLICATE SERVER SETUP for accurate testing
// 1. Rate Limiter (copied from index.js)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, // Limit 5
    message: { error: "Demasiados intentos de inicio de sesión." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Protected route for token testing
app.get('/api/test-protected', verifyToken, (req, res) => {
    res.json({ message: 'Success', user: req.user.username });
});

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

const createUser = async () => {
    const restaurant = await Restaurant.create({ nombre: 'Sec Rest', direccion: 'Sec St' });
    const user = await User.create({ username: 'SecUser', password: 'password123', role: 'encargado', restaurante: restaurant._id });
    return user;
};

describe('Auth Security', () => {
    
    describe('Rate Limiting', () => {
        it('should block after 5 failed attempts', async () => {
            await createUser();

            // 5 allowed attempts
            for (let i = 0; i < 5; i++) {
                const res = await request(app).post('/api/auth/login').send({
                    username: 'SecUser',
                    password: 'wrongpassword'
                });
                expect(res.statusCode).toBe(401);
            }

            // 6th attempt -> Blocked
            const res = await request(app).post('/api/auth/login').send({
                username: 'SecUser',
                password: 'wrongpassword'
            });

            expect(res.statusCode).toBe(429);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toMatch(/Demasiados intentos/);
        });
    });

    describe('Token Validation', () => {
        it('should reject expired tokens', async () => {
            const user = await createUser();
            
            // Create expired token
            const token = jwt.sign(
                { id: user._id }, 
                process.env.JWT_SECRET, 
                { expiresIn: '-1s' } // Expired 1 second ago
            );

            const res = await request(app)
                .get('/api/test-protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toMatch(/Token expirado/);
        });

        it('should reject invalid/malformed tokens', async () => {
            const res = await request(app)
                .get('/api/test-protected')
                .set('Authorization', 'Bearer invalid.token.garbage');

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toMatch(/Token inválido/); // Based on auth.js catch block
        });

        it('should reject token with valid signature but non-existent user', async () => {
            // Valid signature, but random ID
            const token = jwt.sign(
                { id: new mongoose.Types.ObjectId() }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' }
            );

            const res = await request(app)
                .get('/api/test-protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toMatch(/ya no existe/);
        });
    });
});
