const { StatusCodes } = require("http-status-codes");
const { patchTaskSchema, taskSchema } = require("../validation/taskSchema");
//const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

// Create function
async function create(req, res, next) {
  if (!req.body) req.body = {};

  //Joi validation
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  if (value.isCompleted === undefined) {
    value.isCompleted = false;
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: global.user_id, // required
      },
      select: { id: true, title: true, isCompleted: true, priority: true },
    });

    return res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    return next(err);
  }
}

// Read/Index Function
async function index(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (tasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User has no tasks." });
    }

    return res.status(StatusCodes.OK).json(tasks);
  } catch (err) {
    return next(err);
  }
}

// Show Function
async function show(req, res, next) {
  const id = parseInt(req.params.id, 10);

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: id,
          userId: global.user_id,
        },
      },
      select: { id: true, title: true, isCompleted: true },
    });

    if (!task) {
      return res.status(404).json({ message: "The task was not found." });
    }

    return res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }

    return next(err);
  }
}

// Update Function
async function update(req, res, next) {
  if (!req.body) req.body = {};

  //Joi validation
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const id = parseInt(req.params.id, 10);

  try {
    const task = await prisma.task.update({
      data: value, // Joi‑validated changes
      where: {
        id: id,
        userId: global.user_id, // ensures user isolation
      },
      select: { id: true, title: true, isCompleted: true },
    });

    return res.status(StatusCodes.OK).json(task);
  } catch (err) {
    // Prisma "record not found" error
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }

    return next(err);
  }
}

// Delete Function
async function deleteTask(req, res, next) {
  const id = parseInt(req.params.id, 10);

  try {
    await prisma.task.delete({
      where: {
        id_userId: {
          id: id,
          userId: global.user_id,
        },
      },
    });

    return res.status(StatusCodes.OK).json("deleted");
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }

    return next(err);
  }
}
//   const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you get a null
//   if (Number.isNaN(taskToFind)) {
//     return res
//       .status(400)
//       .json({ message: "The task ID passed is not valid." });
//   }

//   let result;

//   try {
//     result = await pool.query(
//       `DELETE FROM tasks
//    WHERE id = $1 AND user_id = $2
//    RETURNING id, title, is_completed`,
//       [taskToFind, global.user_id],
//     );
//     if (result.rows.length === 0) {
//       return res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: "Task not found." });
//     }
//   } catch (e) {
//     return next(e); // forward other errors
//   }
//   return res.status(StatusCodes.OK).json(taskToFind); // return the deleted entry without its userId. The default status code, OK, is returned
// }

module.exports = {
  index,
  show,
  update,
  deleteTask,
  create,
};
