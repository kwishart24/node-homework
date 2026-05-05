const express = require("express");

const taskRouter = express.Router();
const {
  createTask,
  getTaskList,
  deleteTask,
  updateTask,
} = require("../controllers/taskController");

taskRouter.route("/").post(createTask);
taskRouter.route("/").get(getTaskList);
taskRouter.route("/:id").delete(deleteTask);
taskRouter.route("/:id").patch(updateTask);

module.exports = taskRouter;
