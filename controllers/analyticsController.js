const { StatusCodes } = require("http-status-codes");
const prisma = require("../db/prisma");

// ************GET TASK STATS FOR 1 USER BY ID********************
// GET /api/analytics/users/:id
async function getUserAnalytics(req, res, next) {
  try {
    //Parse and validate user ID
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid user ID." });
    }

    //Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found." });
    }

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: { id: true },
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate weekly progress using groupBy
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: { id: true },
    });

    // Return response with taskStats, recentTasks, and weeklyProgress
    return res.status(StatusCodes.OK).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    return next(err);
  }
}

// ************USER LIST WITH TASK COUNT********************

async function listUsers(req, res, next) {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch users with:
    //    - _count.Task (total tasks)
    //    - Task (up to 5 incomplete tasks)
    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: { isCompleted: false },
          select: { id: true },
          take: 5,
        },
        _count: {
          select: { Task: true },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Transform results to match expected output
    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task,
    }));

    // Total user count for pagination
    const totalUsers = await prisma.user.count();

    const pages = Math.ceil(totalUsers / limit);

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };

    // Return response
    return res.status(200).json({
      users,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getUserAnalytics, listUsers };
