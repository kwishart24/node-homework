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

taskRouter.route("/").post(create);
taskRouter.route("/bulk").post(bulkCreate);
taskRouter.route("/").get(index);
taskRouter.route("/:id").get(show);
taskRouter.route("/:id").delete(deleteTask);
taskRouter.route("/:id").patch(update);

module.exports = taskRouter;
