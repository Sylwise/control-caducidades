const request = require('supertest');
const express = require('express');
const catalogRoutes = require('../routes/catalogRoutes');
const authRoutes = require('../routes/authRoutes');
const db = require('./db');
const User = require('../models/User');
const CatalogProduct = require('../models/CatalogProduct');
const ProductStatus = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const statusRoutes = require('../routes/statusRoutes');

const app = express();
app.use(express.json());
// Mock IO
app.set('io', { to: () => ({ emit: () => {} }) });

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/status', statusRoutes);

// Add global error handler
app.use(require('../middleware/errorHandler'));

const createSupervisor = async () => {
    const restaurant = await Restaurant.create({ nombre: 'Val Rest', direccion: 'Val St' });
    const user = await User.create({ username: 'ValSuper', password: 'password123', role: 'supervisor', restaurante: restaurant._id });
    const res = await request(app).post('/api/auth/login').send({ username: 'ValSuper', password: 'password123' });
    return { token: res.body.token, user, restaurant };
};

beforeAll(async () => {
    await db.connect();
    // Force sync indexes to ensure unique constraint
    await CatalogProduct.syncIndexes();
});
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Catalog Validation', () => {

    describe('Field Validation', () => {
        it('should require name', async () => {
            const { token } = await createSupervisor();
            const res = await request(app)
                .post('/api/catalog')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    tipo: 'permanente'
                });
            expect(res.statusCode).toBe(400); // Validation error
        });

        it('should validate type enum', async () => {
            const { token } = await createSupervisor();
            const res = await request(app)
                .post('/api/catalog')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nombre: 'Bad Type',
                    tipo: 'invalid_type'
                });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('Duplicate Prevention', () => {
        it('should prevent duplicate product names', async () => {
            const { token } = await createSupervisor();
            
            // Create first
            await request(app)
                .post('/api/catalog')
                .set('Authorization', `Bearer ${token}`)
                .send({ nombre: 'Unique Burger', tipo: 'permanente' });

            // Create duplicate
            const res = await request(app)
                .post('/api/catalog')
                .set('Authorization', `Bearer ${token}`)
                .send({ nombre: 'Unique Burger', tipo: 'permanente' });

            expect(res.statusCode).toBe(400); // Duplicate key error
            expect(res.body.message).toMatch(/duplicado/); // Check message property
        });
    });

    describe('Cascade Delete', () => {
        it('should delete associated status when product is deleted', async () => {
            const { token, user } = await createSupervisor();
            
            // Create product (this auto-creates status in controller)
            const createRes = await request(app)
                .post('/api/catalog')
                .set('Authorization', `Bearer ${token}`)
                .send({ nombre: 'Delete Me', tipo: 'permanente' });
            
            const productId = createRes.body.data.producto._id;
            const statusId = createRes.body.data._id; // controller returns the status object

            // Verify both exist
            expect(await CatalogProduct.findById(productId)).toBeTruthy();
            expect(await ProductStatus.findById(statusId)).toBeTruthy();

            // Delete product
            const delRes = await request(app)
                .delete(`/api/catalog/${productId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(delRes.statusCode).toBe(204);

            // Verify both GONE
            expect(await CatalogProduct.findById(productId)).toBeNull();
            expect(await ProductStatus.findById(statusId)).toBeNull();
        });
    });
});
