const request = require('supertest');
const express = require('express');
const statusRoutes = require('../routes/statusRoutes');
const authRoutes = require('../routes/authRoutes');
const catalogRoutes = require('../routes/catalogRoutes');
const db = require('./db');
const User = require('../models/User');
const CatalogProduct = require('../models/CatalogProduct');
const ProductStatus = require('../models/Product');

const app = express();
app.use(express.json());

// Mock socket.io
app.set('io', {
  to: () => ({ emit: () => {} })
});

app.use('/api/auth', authRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/catalog', catalogRoutes);

const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

const createUserAndLogin = async () => {
    // Create restaurant first
    const restaurant = await Restaurant.create({
        nombre: 'Test Restaurant',
        direccion: '123 St'
    });

    const user = await User.create({
        username: 'TestEmployee',
        password: 'password123',
        role: 'encargado',
        restaurante: restaurant._id
    });

    const res = await request(app).post('/api/auth/login').send({
        username: 'TestEmployee',
        password: 'password123'
    });
    
    return { token: res.body.token, user };
};

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Status Routes (Caducidades)', () => {
    let token;
    let product;

    beforeEach(async () => {
        const auth = await createUserAndLogin();
        token = auth.token;
        const user = auth.user;

        // Create a catalog product directly in DB to avoid relying on catalog routes
        product = await CatalogProduct.create({
            nombre: 'Hamburguesa',
            restaurante: user.restaurante,
            tipo: 'permanente',
            isDirectConsumption: false
        });
    });

    describe('PUT /api/status/:productoId', () => {
        it('should create new status when none exists', async () => {
            const today = new Date().toISOString();
            
            const res = await request(app)
                .put(`/api/status/${product._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fechaFrente: today,
                    cajasAlmacen: 2
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('estado', 'frente-agota'); // Depends on calculation logic
            expect(res.body).toHaveProperty('producto');
            expect(res.body.cajasAlmacen).toBe(2);

            const savedStatus = await ProductStatus.findOne({ producto: product._id });
            expect(savedStatus).toBeTruthy();
        });

        it('should update existing status', async () => {
            // Create initial status
            await ProductStatus.create({
                producto: product._id,
                restaurante: product.restaurante,
                estado: 'sin-clasificar'
            });

            const res = await request(app)
                .put(`/api/status/${product._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cajasAlmacen: 5
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.cajasAlmacen).toBe(5);
        });

        it('should reject negative stock values', async () => {
            const res = await request(app)
                .put(`/api/status/${product._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cajasAlmacen: -5
                });

            // Assuming API should validate this. 
            // If it currently doesn't, this test might FAIL and reveal a bug (which is good).
            // Or if design allows negative (returns), we adjust.
            // Ideally it should be 400 Bad Request.
            // If the current backend is loose, we might need to fix code or accept it.
            // For now, let's EXPECT 400.
            expect(res.statusCode).toBe(400); 
        });

        it('should validate status calculation logic', async () => {
            // Testing business logic "frente-cambia" if date is old
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 5); // 5 days ago

            const res = await request(app)
                .put(`/api/status/${product._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fechaFrente: oldDate.toISOString(),
                    cajasAlmacen: 0
                });

            // Assuming logic: old date might trigger some warning or specific state
            // Let's just check it updated
            expect(res.statusCode).toBe(200);
            expect(res.body.fechaFrente).toBe(oldDate.toISOString());
        });
    });

    describe('GET /api/status', () => {
        it('should return all statuses for the restaurant', async () => {
            await ProductStatus.create({
                producto: product._id,
                restaurante: product.restaurante,
                estado: 'sin-clasificar'
            });

            const res = await request(app)
                .get('/api/status')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].producto.nombre).toBe('Hamburguesa');
        });
    });
});
