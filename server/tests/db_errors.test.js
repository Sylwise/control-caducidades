const request = require('supertest');
const express = require('express');
const statusRoutes = require('../routes/statusRoutes');
const authRoutes = require('../routes/authRoutes');
const db = require('./db');
const User = require('../models/User');
const CatalogProduct = require('../models/CatalogProduct');
const ProductStatus = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.set('io', { to: () => ({ emit: () => {} }) });

app.use('/api/auth', authRoutes);
app.use('/api/status', statusRoutes);

const createUser = async () => {
    const restaurant = await Restaurant.create({ nombre: 'Error Rest', direccion: 'Err St' });
    const user = await User.create({ username: 'ErrUser', password: 'password123', role: 'encargado', restaurante: restaurant._id });
    const res = await request(app).post('/api/auth/login').send({ username: 'ErrUser', password: 'password123' });
    return { token: res.body.token, user, restaurant };
};

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Database Error Handling', () => {
    it('should return 500 when database save fails', async () => {
        const { token, user, restaurant } = await createUser();
        
        const product = await CatalogProduct.create({
            nombre: 'Error Product',
            restaurante: restaurant._id
        });

        // Initialize status
        await ProductStatus.create({
            producto: product._id,
            restaurante: restaurant._id
        });

        // Mock save to throw
        const saveSpy = jest.spyOn(ProductStatus.prototype, 'save')
            .mockImplementationOnce(() => { throw new Error('Database Connection Failed'); });

        const res = await request(app)
            .put(`/api/status/${product._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                cajasAlmacen: 5
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(/Error al actualizar/); // Based on statusController logs
        
        saveSpy.mockRestore();
    });
});
