const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ["created", "completed", "cancelled", "reopened"], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  at: { type: Date, required: true, default: Date.now },
  reason: { type: String, trim: true, maxlength: 300 },
});

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 300,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      required: true,
    },
    type: {
      type: String,
      enum: ["aviso", "incidencia", "averia", "tarea"],
      default: "tarea",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    comments: [commentSchema],
    activity: { type: [activitySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying because we will filter by restaurant and status often
taskSchema.index({ restaurant: 1, status: 1 });
taskSchema.index({ restaurant: 1, dueDate: 1 });
taskSchema.index({ restaurant: 1, priority: 1 });

module.exports = mongoose.model("Task", taskSchema);
