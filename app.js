const express = require("express");
const app = express();
const authMiddleware = require("./middleware/auth");
const pool = require("./db/pg-pool");

// Wiring for Router to controller for POST
const userRouter = require("./routes/userRoutes");
// Express provided middleware which provides parsing
app.use(express.json({ limit: "1kb" }));

app.use("/api/users", userRouter);

// Globals for user storage in Memory Store
global.user_id = null;
global.users = [];
global.tasks = [];

app.use((req, res, next) => {
  console.log(req.method, req.path, req.query);
  next();
});

//TaskRouter with authMiddleware
const taskRouter = require("./routes/taskRoutes");
app.use("/api/tasks", authMiddleware, taskRouter);

// Health Check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ message: `db not connected, error: ${err.message}` });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "everything worked!" });
});

app.use((req, res) => {
  console.log(`You can't do a ${req.method} for ${req.url}`);
  if (!res.headersSent) {
    res.status(404).send(`You can't do a ${req.method} for ${req.url}.`);
  }
});

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
