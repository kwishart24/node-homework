const { StatusCodes } = require("http-status-codes");
const { patchTaskSchema, taskSchema } = require("../validation/taskSchema");
//const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

// Sorting Helper function
const getOrderBy = (query) => {
  const validSortFields = [
    "title",
    "priority",
    "createdAt",
    "id",
    "isCompleted",
  ];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
  }
  return { createdAt: "desc" }; // default fallback
};

// ************CREATE TASK FUNCTION********************
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

// ************INDEX/READ FUNCTION********************
async function index(req, res, next) {
  try {
    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause with optional search filter
    const whereClause = { userId: global.user_id };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    //Fetch tasks
    const tasks = await prisma.task.findMany({
      where: whereClause,
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
      skip: skip,
      take: limit,
      orderBy: getOrderBy(req.query),
    });

    // Get total count for pagination metadata
    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    // Build pagination object with complete metadata
    const pages = Math.ceil(totalTasks / limit);

    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };

    if (tasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User has no tasks." });
    }

    return res.status(StatusCodes.OK).json({ tasks, pagination });
  } catch (err) {
    return next(err);
  }
}

// ************SHOW FUNCTION********************
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

// ************UPDATE FUNCTION********************
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

// ************DELETE FUNCTION********************
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

module.exports = {
  index,
  show,
  update,
  deleteTask,
  create,
};
