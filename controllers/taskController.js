const { StatusCodes } = require("http-status-codes");

// Task Counter
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

// Create function
function createTask(req, res) {
  const newTask = {
    ...req.body,
    id: taskCounter(),
    userId: global.user_id.email,
  };
  global.tasks.push(newTask);
  const { userId, ...sanitizedTask } = newTask;
  // we don't send back the userId! This statement removes it.
  res.json(sanitizedTask);
}

// Read Function
function getTaskList(req, res) {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );
  if (userTasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User has no tasks." });
  }
  const sanitizedTasks = userTasks.map((task) => {
    const { userId: _drop, ...sanitizedTask } = task;
    return sanitizedTask;
  });
  return res.status(StatusCodes.OK).json(sanitizedTasks);
}

// Update Function
function updateTask(req, res) {
  const userId = req.user.id;
  const taskId = Number(req.params.id);
  const userTasks = global.tasks.filter((t) => t.userId === req.user.id);

  if (Number.isNaN(taskId) || taskId < 1) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "invalid taskId." });
  }

  if (!userTasks) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "userTasks not found." });
  }

  const currentTask = userTasks.find(
    (t) => t.id === taskId && t.userId === userId,
  );
  if (!currentTask) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "task not found." });
  }
  Object.assign(currentTask, req.body);

  const { userId: _drop, ...sanitizedTask } = currentTask;
  return res.status(StatusCodes.OK).json(sanitizedTask);
}

// Delete Function
function deleteTask(req, res) {
  const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  // get a null
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskToFind && task.userId === global.user_id.email,
  );
  // we get the index, not the task, so that we can splice it out
  if (taskIndex === -1) {
    // if no such task
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
    // else it's a 404.
  }
  const { userId, ...task } = global.tasks[taskIndex];
  // pull userId out and keep a copy of everything else, so the response is sanitized
  global.tasks.splice(taskIndex, 1); // do the delete
  return res.json(task); // return the deleted entry without its userId. The default status code, OK, is returned
}

module.exports = {
  getTaskList,
  updateTask,
  deleteTask,
  createTask,
};
