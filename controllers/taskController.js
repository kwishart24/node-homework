const { StatusCodes } = require("http-status-codes");
const { patchTaskSchema, taskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

// Create function
async function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id],
  );

  const newTask = task.rows[0];
  return res.status(StatusCodes.CREATED).json(newTask);
}

// Read/Index Function
async function index(req, res) {
  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id],
  );

  const userTasks = result.rows;

  if (userTasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User has no tasks." });
  }
  return res.status(StatusCodes.OK).json(userTasks);
}

// Show Function
async function show(req, res, next) {
  const taskToShow = parseInt(req.params?.id); // if there are no params, the ? makes sure that you get a null
  if (Number.isNaN(taskToShow)) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  let result;

  try {
    result = await pool.query(
      `SELECT id, title, is_completed 
      FROM tasks
   WHERE id = $1 AND user_id = $2`,
      [taskToShow, global.user_id],
    );
    if (result.rows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Task not found." });
    }
  } catch (e) {
    return next(e); // forward other errors
  }

  const task = result.rows[0];

  return res.status(StatusCodes.OK).json(task);
}

// Update Function
async function update(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const taskChange = {};
  if (value.title !== undefined) taskChange.title = value.title;
  if (value.isCompleted !== undefined)
    taskChange.isCompleted = value.isCompleted;

  let keys = Object.keys(taskChange);

  if (Object.keys(taskChange).length === 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "No valid fields to update." });
  }

  keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const result = await pool.query(
    `UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...Object.values(taskChange), req.params.id, global.user_id],
  );

  if (result.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task not found." });
  }

  const updatedTask = result.rows[0];
  return res.status(StatusCodes.OK).json(updatedTask);
}

// Delete Function
async function deleteTask(req, res, next) {
  const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you get a null
  if (Number.isNaN(taskToFind)) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  let result;

  try {
    result = await pool.query(
      `DELETE FROM tasks
   WHERE id = $1 AND user_id = $2
   RETURNING id, title, is_completed`,
      [taskToFind, global.user_id],
    );
    if (result.rows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Task not found." });
    }
  } catch (e) {
    return next(e); // forward other errors
  }
  return res.status(StatusCodes.OK).json(taskToFind); // return the deleted entry without its userId. The default status code, OK, is returned
}

module.exports = {
  index,
  show,
  update,
  deleteTask,
  create,
};
