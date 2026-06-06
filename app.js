const express = require("express");
const app = express();
//const authMiddleware = require("./middleware/auth");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const pool = require("./db/pg-pool");
const prisma = require("./db/prisma");
const analyticsRoutes = require("./routes/analyticsRoutes");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

// Wiring for userRouter to controller for POST
const userRouter = require("./routes/userRoutes");

//Other Security Middleware
app.set("trust proxy", 1);

//Rate Limiting
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

//Helmet
app.use(helmet());

// Express provided middleware which provides parsing
app.use(express.json({ limit: "1mb" }));

//Cookie Parser
app.use(cookieParser());

//XSS Protection
app.use(xss());

app.use("/api/users", userRouter);

// Globals for user storage in Memory Store
global.user_id = null;
global.users = [];
global.tasks = [];

app.use((req, res, next) => {
  console.log(req.method, req.path, req.query);
  next();
});

//TaskRouter with jwtMiddleware
const taskRouter = require("./routes/taskRoutes");
app.use("/api/tasks", jwtMiddleware, taskRouter);

//AnalyticsRouter with jwtMiddleware
app.use("/api/analytics", jwtMiddleware, analyticsRoutes);

// Health Check
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "everything worked!" });
});

app.use((req, res, next) => {
  console.log(`You can't do a ${req.method} for ${req.url}`);
  if (!res.headersSent) {
    res.status(404).send(`You can't do a ${req.method} for ${req.url}.`);
  }
  next();
});

//Error Handler
const errorHandler = require("./middleware/error-handler");

app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(
    `Server is listening on port ${port}...http://localhost:${port}/`,
  ),
);

//Exiting cleanly
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
    // If you have DB connections, close them here
    await pool.end();
    console.log("Pool disconnected");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
