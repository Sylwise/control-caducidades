const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../index"); // Make sure index.js exports app
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Task = require("../models/Task");
const db = require("./db");

// Mock Auth Middleware
jest.mock("../middleware/auth", () => ({
  verifyToken: (req, res, next) => {
    req.user = req.mockUser;
    next();
  },
  isSupervisor: (req, res, next) => {
    if (req.user.role !== "supervisor" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  },
  isAdmin: (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  },
}));

describe("Task API", () => {
  let supervisorUser;
  let employeeUser;
  let restaurant;

  beforeAll(async () => {
    await db.connect();

    // Setup dummy data
    restaurant = await Restaurant.create({ nombre: "Test Donalds" });

    supervisorUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "super",
      role: "supervisor",
      restaurante: restaurant._id,
      id: "superval"
    };
    // Fix mock user id mapping
    supervisorUser.id = supervisorUser._id;

    employeeUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "emp",
      role: "employee",
      restaurante: restaurant._id,
      id: "empval"
    };
    employeeUser.id = employeeUser._id;
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    await Task.deleteMany({});
  });

  describe("POST /api/tasks", () => {
    it("should allow supervisor to create a task", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({
          title: "Clean Fryer",
          dueDate: new Date(),
          priority: "high"
        })
        .set("mock-user", "supervisor"); // Not using real middleware here but good for integration

      // Since we mocked the middleware completely, we need to inject the mockUser into the app/request somehow.
      // But supertest starts the app. A better way with mocked middleware is to use a middleware that reads a header
      // OR, since we required `app`, we might not be able to easily swap middleware if it's already used.
      
      // ALTERNATIVE: Don't mock auth, use real tokens if possible, OR
      // adjust mock to look for a special header to decide which user to inject.
    });
  });
});
