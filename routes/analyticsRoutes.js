const express = require("express");

const analyticsRouter = express.Router();

const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

analyticsRouter.route("/users/:id").get(getUserAnalytics);
analyticsRouter.route("/users").get(getUsersWithStats);
analyticsRouter.route("/tasks/search").get(searchTasks);

module.exports = analyticsRouter;
