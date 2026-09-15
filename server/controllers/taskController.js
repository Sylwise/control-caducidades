const mongoose = require("mongoose");
const Task = require("../models/Task");

const population = [
  { path: "createdBy", select: "username name" },
  { path: "completedBy", select: "username name" },
  { path: "comments.user", select: "username name" },
  { path: "activity.user", select: "username name" },
];

const emitTask = (req, event, task) => {
  req.app.get("io")?.to(req.user.restaurante.toString()).emit(event, task);
};
const taskFilter = (req) => ({ _id: req.params.id, restaurant: req.user.restaurante });
const conflictOrNotFound = async (req, res) => {
  const exists = await Task.exists(taskFilter(req));
  return res.status(exists ? 409 : 404).json({
    error: exists ? "La tarea ya ha cambiado de estado. Actualiza para ver su estado actual." : "Tarea no encontrada",
  });
};

// Preserve known legacy creation/completion data, without inventing unknown events.
// Both the baseline and the next event are stored in one atomic update.
const activityWith = (event) => ({
  $concatArrays: [
    { $cond: [
      { $gt: [{ $size: { $ifNull: ["$activity", []] } }, 0] },
      "$activity",
      { $concatArrays: [
        [{ type: "created", user: "$createdBy", at: "$createdAt" }],
        { $cond: [
          { $and: ["$completedBy", "$completedAt"] },
          [{ type: "completed", user: "$completedBy", at: "$completedAt" }],
          [],
        ] },
      ] },
    ] },
    { $literal: [event] },
  ],
});

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, type } = req.body;
    const task = await Task.create({
      title, description, dueDate, priority, type,
      restaurant: req.user.restaurante, createdBy: req.user._id,
      activity: [{ type: "created", user: req.user._id, at: new Date() }],
    });
    await task.populate(population);
    emitTask(req, "task:created", task);
    res.status(201).json(task);
  } catch (error) { next(error); }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, limit = 50 } = req.query;
    const filter = { restaurant: req.user.restaurante };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const tasks = await Task.find(filter).populate(population).sort({ dueDate: 1, _id: 1 }).limit(limit);
    res.json(tasks);
  } catch (error) { next(error); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const changes = {};
    for (const field of ["title", "description", "dueDate", "priority", "type"]) {
      if (req.body[field] !== undefined) changes[field] = req.body[field];
    }
    const task = await Task.findOneAndUpdate(
      { ...taskFilter(req), status: "pending" }, { $set: changes }, { new: true, runValidators: true }
    ).populate(population);
    if (!task) return await conflictOrNotFound(req, res);
    emitTask(req, "task:updated", task);
    res.json(task);
  } catch (error) { next(error); }
};

const transition = (allowedStates, status, eventType, socketEvent) => async (req, res, next) => {
  try {
    const now = new Date();
    const event = { _id: new mongoose.Types.ObjectId(), type: eventType, user: req.user._id, at: now };
    if (["cancelled", "reopened"].includes(eventType)) event.reason = req.body.reason;
    const task = await Task.findOneAndUpdate(
      { ...taskFilter(req), status: { $in: allowedStates } },
      [{ $set: {
        status,
        completedBy: status === "completed" ? { $literal: req.user._id } : null,
        completedAt: status === "completed" ? now : null,
        activity: activityWith(event), updatedAt: now,
      } }], { new: true }
    ).populate(population);
    if (!task) return await conflictOrNotFound(req, res);
    emitTask(req, socketEvent, task);
    res.json(task);
  } catch (error) { next(error); }
};

exports.completeTask = transition(["pending"], "completed", "completed", "task:completed");
exports.cancelTask = transition(["pending"], "cancelled", "cancelled", "task:cancelled");
exports.reopenTask = transition(["completed", "cancelled"], "pending", "reopened", "task:reopened");

exports.addComment = async (req, res, next) => {
  try {
    const comment = { _id: new mongoose.Types.ObjectId(), user: req.user._id, text: req.body.text, createdAt: new Date() };
    const task = await Task.findOneAndUpdate(
      taskFilter(req), { $push: { comments: comment } }, { new: true, runValidators: true }
    ).populate("comments.user", "username name");
    if (!task) return res.status(404).json({ error: "Tarea no encontrada" });
    const addedComment = task.comments.id(comment._id);
    req.app.get("io")?.to(req.user.restaurante.toString()).emit("task:commented", {
      taskId: task._id, comment: addedComment,
    });
    res.json(addedComment);
  } catch (error) { next(error); }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { restaurant: req.user.restaurante } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json({
      pending: stats.find((s) => s._id === "pending")?.count || 0,
      completed: stats.find((s) => s._id === "completed")?.count || 0,
      cancelled: stats.find((s) => s._id === "cancelled")?.count || 0,
      total: stats.reduce((sum, s) => sum + s.count, 0),
    });
  } catch (error) { next(error); }
};
