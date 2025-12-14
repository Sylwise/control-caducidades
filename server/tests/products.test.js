const request = require('supertest');
const express = require('express');
const catalogRoutes = require('../routes/catalogRoutes');
const authRoutes = require('../routes/authRoutes');
const db = require('./db');
const User = require('../models/User');
const CatalogProduct = require('../models/CatalogProduct');

const app = express();
app.use(express.json());

// Mock socket.io
app.set('io', {
  to: () => ({ emit: () => {} })
});

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);

const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

const createEmployee = async () => {
    // Create restaurant
    const restaurant = await Restaurant.create({
        nombre: 'Test Restaurant',
        direccion: '123 St'
    });

    const user = await User.create({
        username: 'Employee',
        password: 'password123',
        role: 'encargado',
        restaurante: restaurant._id
    });
    const res = await request(app).post('/api/auth/login').send({
        username: 'Employee',
        password: 'password123'
    });
    return { token: res.body.token, user };
};

const createSupervisor = async () => {
    // Create restaurant
    const restaurant = await Restaurant.create({
        nombre: 'Sup Restaurant',
        direccion: '456 St'
    });

    const user = await User.create({
        username: 'Supervisor',
        password: 'password123',
        role: 'supervisor',
        restaurante: restaurant._id
    });
    const res = await request(app).post('/api/auth/login').send({
        username: 'Supervisor',
        password: 'password123'
    });
    return { token: res.body.token, user };
};

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Catalog Routes', () => {
    
    describe('GET /api/catalog', () => {
        it('should list products for authenticated user', async () => {
            const { token, user } = await createEmployee();
            
            await CatalogProduct.create({
                nombre: 'Fries',
                restaurante: user.restaurante,
                tipo: 'permanente'
            });

            const res = await request(app)
                .get('/api/catalog')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].nombre).toBe('Fries');
        });

        it('should return 401 if not authenticated', async () => {
             const res = await request(app).get('/api/catalog');
             expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/catalog', () => {
        it('should create product if supervisor', async () => {
            const { token } = await createSupervisor();

            const res = await request(app)
                .post('/api/catalog')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nombre: 'New Burger',
                    tipo: 'permanente',
                    isDirectConsumption: false
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.producto.nombre).toBe('New Burger');
            
            const inDb = await CatalogProduct.findOne({ nombre: 'New Burger' });
            expect(inDb).toBeTruthy();
        });

        it('should deny creation if employee', async () => {
            const { token } = await createEmployee();

            const res = await request(app)
                .post('/api/catalog')
                .set('x-auth-token', token)
                .send({
                    nombre: 'Hacker Burger',
                    tipo: 'permanente'
                });

            // Expect 403 Forbidden or 401 Unauthorized depending on middleware
            // Assuming isSupervisor middleware likely returns 403
            expect([401, 403]).toContain(res.statusCode);
        });
    });

    describe('DELETE /api/catalog/:id', () => {
        it('should delete product if supervisor', async () => {
            const { token, user } = await createSupervisor();
            const product = await CatalogProduct.create({
                nombre: 'To Delete',
                restaurante: user.restaurante
            });

            const res = await request(app)
                .delete(`/api/catalog/${product._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(204);
            
            const check = await CatalogProduct.findById(product._id);
            expect(check).toBeNull();
        });

        it('should deny delete if employee', async () => {
             const { token, user } = await createEmployee();
             // Create product directly in DB (since employee cannot create via API)
             const product = await CatalogProduct.create({
                 nombre: 'To Keep',
                 restaurante: user.restaurante
             });

             const res = await request(app)
                 .delete(`/api/catalog/${product._id}`)
                 .set('Authorization', `Bearer ${token}`);

             // Expect 403 Forbidden (or 401)
             expect([401, 403]).toContain(res.statusCode);
             
             // Verify it still exists
             const check = await CatalogProduct.findById(product._id);
             expect(check).toBeTruthy();
        });
    });
});
