const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const db = require('./db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Mock socket.io
app.set('io', {
  to: () => ({ emit: () => {} })
});

app.use('/api/auth', authRoutes);

// Helper to create a user and restaurant
const createUser = async (overrides = {}) => {
  // Create a real restaurant first
  const restaurant = await Restaurant.create({
      nombre: 'Test Restaurant',
      direccion: '123 Test St'
  });

  const user = await User.create({
    username: 'TestUser',
    password: 'password123',
    role: 'encargado',
    restaurante: restaurant._id,
    ...overrides
  });
  
  return user;
};

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Auth Routes Integration', () => {

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createUser({ username: 'LoginUser', password: 'password123' });

      const res = await request(app).post('/api/auth/login').send({
        username: 'LoginUser',
        password: 'password123'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid password', async () => {
      await createUser({ username: 'WrongPassUser', password: 'password123' });

      const res = await request(app).post('/api/auth/login').send({
        username: 'WrongPassUser',
        password: 'wrongpass'
      });

      expect(res.statusCode).toBe(401); // Or 401
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas'); // Note: Controller returns "error", test expected "msg" previously
    });
    
    it('should reject non-existent user', async () => {
        const res = await request(app).post('/api/auth/login').send({
          username: 'GhostUser',
          password: 'password123'
        });
  
        expect(res.statusCode).toBe(401); // Controller returns 401 for non-existent
        expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = await createUser({ username: 'MeUser' });
      // Login to get token
      const loginRes = await request(app).post('/api/auth/login').send({
        username: user.username,
        password: 'password123'
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', user.username);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });
});
