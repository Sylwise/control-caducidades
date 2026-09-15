const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const taskController = require("../controllers/taskController");

const TASK_TYPES = ["aviso", "incidencia", "averia", "tarea"];
const TASK_PRIORITIES = ["urgent", "high", "medium", "low"];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const taskIdValidation = () => param("id", "Invalid task id").isMongoId();

// All routes require authentication
router.use(auth.verifyToken);

// @route   POST api/tasks
// @desc    Create a new task
// @access  Supervisor/Admin
router.post(
  "/",
  [
    auth.isSupervisor,
    body("title").isString().trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isString().trim().isLength({ max: 500 }),
    body("dueDate", "Due date must be a valid ISO date").isISO8601().toDate(),
    body("priority")
      .exists().withMessage("Priority is required")
      .isIn(TASK_PRIORITIES).withMessage("Invalid priority value"),
    body("type")
      .exists().withMessage("Type is required")
      .isIn(TASK_TYPES).withMessage("Invalid task type"),
    validateRequest,
  ],
  taskController.createTask
);

// @route   GET api/tasks
// @desc    Get all tasks for the restaurant
// @access  Private
router.get(
  "/",
  [
    query("status").optional().isIn(["pending", "completed"]),
    query("priority").optional().isIn(TASK_PRIORITIES),
    query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
    validateRequest,
  ],
  taskController.getTasks
);

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Supervisor/Admin
router.put(
  "/:id",
  [
    auth.isSupervisor,
    taskIdValidation(),
    body("title").optional().isString().trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isString().trim().isLength({ max: 500 }),
    body("dueDate").optional().isISO8601().toDate(),
    body("priority").optional().isIn(TASK_PRIORITIES),
    body("type").optional().isIn(TASK_TYPES),
    validateRequest,
  ],
  taskController.updateTask
);

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Supervisor/Admin
router.delete(
  "/:id",
  [auth.isSupervisor, taskIdValidation(), validateRequest],
  taskController.deleteTask
);

// @route   POST api/tasks/:id/complete
// @desc    Mark a task as completed
// @access  Private
router.post(
  "/:id/complete",
  [taskIdValidation(), validateRequest],
  taskController.completeTask
);

// @route   POST api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post(
  "/:id/comments",
  [
    taskIdValidation(),
    body("text").isString().trim().isLength({ min: 1, max: 300 }),
    validateRequest,
  ],
  taskController.addComment
);

// @route   GET api/tasks/stats/metrics
// @desc    Get task statistics
// @access  Supervisor/Admin
router.get("/stats/metrics", auth.isSupervisor, taskController.getStats);

module.exports = router;
