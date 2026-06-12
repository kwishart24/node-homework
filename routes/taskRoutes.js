const express = require("express");

const taskRouter = express.Router();
const {
  create,
  bulkCreate,
  index,
  show,
  deleteTask,
  update,
} = require("../controllers/taskController");

//*******CREATE TASK SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

taskRouter.route("/").post(create);

//*******CREATE BULK TASKS SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/tasks/bulk:
 *   post:
 *     summary: Create multiple tasks in a single request
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tasks]
 *             properties:
 *               tasks:
 *                 type: array
 *                 description: Array of task objects to create
 *                 items:
 *                   $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Bulk task creation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bulk task creation successful
 *                 tasksCreated:
 *                   type: number
 *                   example: 8
 *                 totalRequested:
 *                   type: number
 *                   example: 8
 *       400:
 *         description: Invalid data or validation error
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

taskRouter.route("/bulk").post(bulkCreate);

//*******GET ALL TASKS FOR LOGGED-IN USER SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

taskRouter.route("/").get(index);

//*******GET TASK BY ID SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

taskRouter.route("/:id").get(show);

//*******DELETE TASK BY ID SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

taskRouter.route("/:id").delete(deleteTask);

//*******UPDATE TASK BY ID SWAGGER COMMENTS******** */
/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update a task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

taskRouter.route("/:id").patch(update);

module.exports = taskRouter;
