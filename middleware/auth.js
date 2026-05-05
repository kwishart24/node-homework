const { StatusCodes } = require("http-status-codes");

function authMiddleware(req, res, next) {
  if (global.use_id === null) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "unauthorized" });
  }
  next();
}

module.exports = authMiddleware;
