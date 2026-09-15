const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const authRoutes = require("../routes/authRoutes");
const taskRoutes = require("../routes/tasks");
const errorHandler = require("../middleware/errorHandler");
const db = require("./db");
const Restaurant = require("../models/Restaurant");
const Task = require("../models/Task");
const User = require("../models/User");

const app = express();
app.use(express.json());
app.set("io", { to: () => ({ emit: () => {} }) });
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use(errorHandler);

const createRestaurant = (name) =>
  Restaurant.create({ nombre: name, direccion: `${name} address` });

const createUserAndLogin = async ({ username, role, restaurant }) => {
  const password = "password123";
  const user = await User.create({
    username,
    password,
    role,
    restaurante: restaurant._id,
  });
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username, password });

  expect(response.statusCode).toBe(200);
  expect(response.body.token).toBeTruthy();
  return { user, token: response.body.token };
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const validTask = (overrides = {}) => ({
  title: "Revisar aviso operativo",
  description: "Comprobar la incidencia comunicada",
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  priority: "high",
  type: "incidencia",
  ...overrides,
});

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("Task API", () => {
  test.each(["supervisor", "admin"])(
    "%s can create a task with a type",
    async (role) => {
      const restaurant = await createRestaurant(`${role} restaurant`);
      const { user, token } = await createUserAndLogin({
        username: `${role}User`,
        role,
        restaurant,
      });

      const response = await request(app)
        .post("/api/tasks")
        .set(auth(token))
        .send(validTask({ type: "averia" }));

      expect(response.statusCode).toBe(201);
      expect(response.body.type).toBe("averia");
      expect(response.body.restaurant).toBe(restaurant._id.toString());
      expect(response.body.createdBy._id).toBe(user._id.toString());

      const persisted = await Task.findById(response.body._id);
      expect(persisted.type).toBe("averia");
      expect(persisted.restaurant.toString()).toBe(restaurant._id.toString());
    }
  );

  test("encargado cannot create a task", async () => {
    const restaurant = await createRestaurant("Encargado restaurant");
    const { token } = await createUserAndLogin({
      username: "encargadoCreate",
      role: "encargado",
      restaurant,
    });

    const response = await request(app)
      .post("/api/tasks")
      .set(auth(token))
      .send(validTask());

    expect(response.statusCode).toBe(403);
    expect(await Task.countDocuments()).toBe(0);
  });

  test("a restaurant only reads its own tasks", async () => {
    const restaurantA = await createRestaurant("Restaurant A");
    const restaurantB = await createRestaurant("Restaurant B");
    const { user: userA, token } = await createUserAndLogin({
      username: "readerA",
      role: "encargado",
      restaurant: restaurantA,
    });
    const userB = await User.create({
      username: "readerB",
      password: "password123",
      role: "encargado",
      restaurante: restaurantB._id,
    });
    const [taskA, taskB] = await Task.create([
      { ...validTask({ title: "Task A" }), restaurant: restaurantA._id, createdBy: userA._id },
      { ...validTask({ title: "Task B" }), restaurant: restaurantB._id, createdBy: userB._id },
    ]);

    const response = await request(app).get("/api/tasks").set(auth(token));

    expect(response.statusCode).toBe(200);
    expect(response.body.map((task) => task._id)).toEqual([taskA._id.toString()]);
    expect(response.body.map((task) => task._id)).not.toContain(taskB._id.toString());
  });

  test("a restaurant cannot modify another restaurant task", async () => {
    const restaurantA = await createRestaurant("Supervisor restaurant");
    const restaurantB = await createRestaurant("Foreign restaurant");
    const { user: supervisor, token } = await createUserAndLogin({
      username: "supervisorTenant",
      role: "supervisor",
      restaurant: restaurantA,
    });
    const foreignTask = await Task.create({
      ...validTask({ title: "Foreign task" }),
      restaurant: restaurantB._id,
      createdBy: supervisor._id,
    });

    const updateResponse = await request(app)
      .put(`/api/tasks/${foreignTask._id}`)
      .set(auth(token))
      .send({ title: "Modified task" });
    const completeResponse = await request(app)
      .post(`/api/tasks/${foreignTask._id}/complete`)
      .set(auth(token));
    const commentResponse = await request(app)
      .post(`/api/tasks/${foreignTask._id}/comments`)
      .set(auth(token))
      .send({ text: "Foreign comment" });
    const deleteResponse = await request(app)
      .delete(`/api/tasks/${foreignTask._id}`)
      .set(auth(token));

    expect(updateResponse.statusCode).toBe(404);
    expect(completeResponse.statusCode).toBe(404);
    expect(commentResponse.statusCode).toBe(404);
    expect(deleteResponse.statusCode).toBe(404);
    const persisted = await Task.findById(foreignTask._id);
    expect(persisted.title).toBe("Foreign task");
    expect(persisted.status).toBe("pending");
    expect(persisted.comments).toHaveLength(0);
  });

  test("a legacy task without type is read as tarea", async () => {
    const restaurant = await createRestaurant("Legacy restaurant");
    const { user, token } = await createUserAndLogin({
      username: "legacyReader",
      role: "encargado",
      restaurant,
    });
    const result = await Task.collection.insertOne({
      title: "Legacy task",
      description: "Created before task classification",
      dueDate: new Date(Date.now() + 86400000),
      priority: "medium",
      status: "pending",
      restaurant: restaurant._id,
      createdBy: user._id,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).get("/api/tasks").set(auth(token));

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(result.insertedId.toString());
    expect(response.body[0].type).toBe("tarea");
  });

  test("encargado completes a task with completion audit data", async () => {
    const restaurant = await createRestaurant("Completion restaurant");
    const { user, token } = await createUserAndLogin({
      username: "encargadoComplete",
      role: "encargado",
      restaurant,
    });
    const task = await Task.create({
      ...validTask(),
      restaurant: restaurant._id,
      createdBy: user._id,
    });

    const response = await request(app)
      .post(`/api/tasks/${task._id}/complete`)
      .set(auth(token));

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("completed");
    expect(response.body.completedBy._id).toBe(user._id.toString());
    expect(new Date(response.body.completedAt).toString()).not.toBe("Invalid Date");

    const persisted = await Task.findById(task._id);
    expect(persisted.completedBy.toString()).toBe(user._id.toString());
    expect(persisted.completedAt).toBeInstanceOf(Date);
  });

  test("encargado comments on a task", async () => {
    const restaurant = await createRestaurant("Comment restaurant");
    const { user, token } = await createUserAndLogin({
      username: "encargadoComment",
      role: "encargado",
      restaurant,
    });
    const task = await Task.create({
      ...validTask(),
      restaurant: restaurant._id,
      createdBy: user._id,
    });

    const response = await request(app)
      .post(`/api/tasks/${task._id}/comments`)
      .set(auth(token))
      .send({ text: "Incidencia revisada" });

    expect(response.statusCode).toBe(200);
    expect(response.body.text).toBe("Incidencia revisada");
    expect(response.body.user._id).toBe(user._id.toString());

    const persisted = await Task.findById(task._id);
    expect(persisted.comments).toHaveLength(1);
    expect(persisted.comments[0].user.toString()).toBe(user._id.toString());
  });

  test.each([
    ["missing type", validTask({ type: undefined })],
    ["invalid type", validTask({ type: "limpieza" })],
    ["invalid priority", validTask({ priority: "critical" })],
    ["invalid date", validTask({ dueDate: "not-a-date" })],
    ["short title", validTask({ title: "ab" })],
    ["long description", validTask({ description: "x".repeat(501) })],
  ])("invalid create input returns 400: %s", async (_caseName, body) => {
    const restaurant = await createRestaurant(`Invalid ${_caseName}`);
    const { token } = await createUserAndLogin({
      username: `invalid${_caseName.replace(/\s/g, "").slice(0, 10)}`,
      role: "supervisor",
      restaurant,
    });

    const response = await request(app)
      .post("/api/tasks")
      .set(auth(token))
      .send(body);

    expect(response.statusCode).toBe(400);
    expect(await Task.countDocuments()).toBe(0);
  });

  test("invalid comment and task id return 400", async () => {
    const restaurant = await createRestaurant("Invalid comment restaurant");
    const { token } = await createUserAndLogin({
      username: "invalidComment",
      role: "encargado",
      restaurant,
    });

    const invalidComment = await request(app)
      .post(`/api/tasks/${new mongoose.Types.ObjectId()}/comments`)
      .set(auth(token))
      .send({ text: " ".repeat(301) });
    const invalidId = await request(app)
      .post("/api/tasks/not-an-id/complete")
      .set(auth(token));

    expect(invalidComment.statusCode).toBe(400);
    expect(invalidId.statusCode).toBe(400);
  });
});
