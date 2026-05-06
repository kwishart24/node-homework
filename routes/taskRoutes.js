const express = require("express");

const taskRouter = express.Router();
const {
  create,
  index,
  show,
  deleteTask,
  updateTask,
} = require("../controllers/taskController");

taskRouter.route("/").post(create);
taskRouter.route("/").get(index);
taskRouter.route("/:id").get(show);
taskRouter.route("/:id").delete(deleteTask);
taskRouter.route("/:id").patch(updateTask);

module.exports = taskRouter;
