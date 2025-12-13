const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

// Mock specific controller methods to avoid DB connection in unit tests
// For a true integration test, we would connect to a test DB, but let's start with a simple route check
// If we want to test the full app, we should import app from index.js, but index.js starts the server immediately.
// Strategy: Create a test app instance for route testing to bypass DB requirement for this initial smoke test.

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock the authController methods if they are not mocked by Jest automatically (integration vs unit)
// For this smoke test, let's verify if the route is registered.
// Since we don't have a pure "health" endpoint in authRoutes (my previous audit showed login/me/users),
// I will try to hit the login endpoint with missing credentials to see if validation kicks in.

jest.mock('../controllers/authController', () => ({
  login: (req, res) => res.status(400).json({ msg: 'Mock Validation Error' }),
  getCurrentUser: (req, res) => res.status(401).json({ msg: 'Mock Unauth' }),
  changePassword: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mock middleware
jest.mock('../middleware/auth', () => ({
  verifyToken: (req, res, next) => next(),
  isSupervisor: (req, res, next) => next(),
}));

describe('Auth Routes Smoke Test', () => {
  it('POST /login should reach the controller', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    // We expect 400 because our mock controller returns it, proving the route is wired up
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ msg: 'Mock Validation Error' });
  });

  it('GET /me should be protected (mocked middleware passes, controller returns 401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
  });
});
