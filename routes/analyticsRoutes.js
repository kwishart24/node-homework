const express = require("express");

const analyticsRouter = express.Router();

const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

//*******GET ANALYTICS FOR SPECIFIC USER BY ID SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/analytics/users/{id}:
 *   get:
 *     summary: Get analytics for a specific user by ID
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID to retrieve analytics for
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAnalytics'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

analyticsRouter.route("/users/:id").get(getUserAnalytics);

//*******GET ANALYTICS FOR ALL USERS SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get analytics for all users, including task statistics
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users with analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserAnalytics'
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

analyticsRouter.route("/users").get(getUsersWithStats);

//*******SEARCH TASKS SWAGGER COMMENTS******** */
/**
 * @swagger
 * /api/analytics/tasks/search:
 *   get:
 *     summary: Search tasks using raw SQL with pagination and relevance ranking
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (minimum 2 characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                   example: "groceries"
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid search query or pagination parameters
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

analyticsRouter.route("/tasks/search").get(searchTasks);

module.exports = analyticsRouter;
