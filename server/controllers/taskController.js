const Task = require("../models/Task");
const User = require("../models/User");
const logger = require("../logger");

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, type } = req.body;
    
    // Create new task associated with the restaurant of the creator
    const newTask = new Task({
      title,
      description,
      dueDate,
      priority,
      type,
      restaurant: req.user.restaurante,
      createdBy: req.user.id,
    });

    const savedTask = await newTask.save();
    
    // Populate creator info for immediate UI update
    await savedTask.populate("createdBy", "username name");

    // Notify clients connected to the creator's restaurant room.
    const io = req.app.get("io");
    if (io) {
      io.to(req.user.restaurante.toString()).emit("task:created", savedTask);
    }

    res.status(201).json(savedTask);
  } catch (error) {
    logger.error("Error creating task:", error);
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, limit = 50 } = req.query;
    const filter = { restaurant: req.user.restaurante };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate("createdBy", "username name")
      .populate("completedBy", "username name")
      .populate("comments.user", "username name")
      .sort({ dueDate: 1, priority: -1 }) // Sort by due date asc, then priority desc
      .limit(limit);

    res.json(tasks);
  } catch (error) {
    logger.error("Error fetching tasks:", error);
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, type } = req.body;
    
    // Find task and ensure it belongs to user's restaurant
    let task = await Task.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurante
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Role authorization is enforced by the route middleware.
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.type = type || task.type;

    await task.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.restaurante.toString()).emit("task:updated", task);
    }

    res.json(task);
  } catch (error) {
    logger.error("Error updating task:", error);
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurante
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await task.deleteOne();

    const io = req.app.get("io");
    if (io) {
      // Fetch user name for the notification
      const currentUser = await User.findById(req.user.id);
      const actorName = currentUser ? (currentUser.name || currentUser.username) : "Un usuario";

      io.to(req.user.restaurante.toString()).emit("task:deleted", {
        taskId: req.params.id,
        actor: req.user.id.toString(),
        actorName: actorName
      });
    }

    res.json({ message: "Task removed" });
  } catch (error) {
    logger.error("Error deleting task:", error);
    next(error);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurante
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.status === "completed") {
      return res.status(400).json({ error: "Task already completed" });
    }

    task.status = "completed";
    task.completedBy = req.user.id;
    task.completedAt = new Date();

    await task.save();
    
    // Populate for response
    await task.populate("completedBy", "username name");

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.restaurante.toString()).emit("task:completed", task);
    }

    res.json(task);
  } catch (error) {
    logger.error("Error completing task:", error);
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurante
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const newComment = {
      user: req.user.id,
      text: req.body.text,
      createdAt: new Date()
    };

    task.comments.push(newComment);
    await task.save();
    
    // Re-fetch to populate comment user
    const updatedTask = await Task.findById(task._id).populate("comments.user", "username name");
    const addedComment = updatedTask.comments[updatedTask.comments.length - 1];

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.restaurante.toString()).emit("task:commented", {
        taskId: task._id,
        comment: addedComment
      });
    }

    res.json(addedComment);
  } catch (error) {
    logger.error("Error adding comment:", error);
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurante;
    
    // Simple aggregation for dashboard
    const stats = await Task.aggregate([
      { $match: { restaurant: restaurantId } },
      { 
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Can add more complex stats here (e.g., efficiency, user ranking)
    
    const formattedStats = {
      pending: stats.find(s => s._id === 'pending')?.count || 0,
      completed: stats.find(s => s._id === 'completed')?.count || 0,
      total: stats.reduce((acc, curr) => acc + curr.count, 0)
    };

    res.json(formattedStats);
  } catch (error) {
    logger.error("Error fetching task stats:", error);
    next(error);
  }
};
