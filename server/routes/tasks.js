const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const taskController = require("../controllers/taskController");

// All routes require authentication
router.use(auth.verifyToken);

// @route   POST api/tasks
// @desc    Create a new task
// @access  Supervisor/Admin
router.post(
  "/",
  [
    auth.isSupervisor,
    body("title", "Title is required").not().isEmpty(),
    body("dueDate", "Due date is required").not().isEmpty(),
    body("priority")
      .exists().withMessage("Priority is required")
      .isIn(["urgent", "high", "medium", "low"]).withMessage("Invalid priority value"),
  ],
  taskController.createTask
);

// @route   GET api/tasks
// @desc    Get all tasks for the restaurant
// @access  Private
router.get("/", taskController.getTasks);

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Supervisor/Admin
router.put(
  "/:id",
  [
    auth.isSupervisor,
    body("title", "Title is required").optional().not().isEmpty(),
  ],
  taskController.updateTask
);

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Supervisor/Admin
router.delete("/:id", auth.isSupervisor, taskController.deleteTask);

// @route   POST api/tasks/:id/complete
// @desc    Mark a task as completed
// @access  Private
router.post("/:id/complete", taskController.completeTask);

// @route   POST api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post(
  "/:id/comments",
  [
    body("text", "Comment text is required").not().isEmpty(),
  ],
  taskController.addComment
);

// @route   GET api/tasks/stats/metrics
// @desc    Get task statistics
// @access  Supervisor/Admin
router.get("/stats/metrics", auth.isSupervisor, taskController.getStats);

module.exports = router;
