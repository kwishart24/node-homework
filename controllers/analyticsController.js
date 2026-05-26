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
async function getUsersWithStats(req, res, next) {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (page < 1) {
      return res.status(400).json({ error: "Page must be >= 1" });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

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

// ************RAW SQL SEARCH********************
//GET /api/analytics/tasks/search
async function searchTasks(req, res, next) {
  try {
    // Validate search query
    const searchQuery = req.query.q;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }

    // Parse limit (default 20)
    const limit = parseInt(req.query.limit) || 20;

    // 3. Build search patterns (parameterized)
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    // 4. Raw SQL search with relevance ordering
    const searchResults = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY 
        CASE 
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit};
    `;

    // Return results
    return res.status(200).json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };
