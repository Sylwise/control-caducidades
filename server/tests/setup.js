// Setup global test environment (e.g., env vars)
process.env.NODE_ENV = 'test';
process.env.PORT = 5001; // Avoid conflict with dev server
process.env.JWT_SECRET = 'test-secret-key-123';
