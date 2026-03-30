const { StatusCodes } = require("http-status-codes");

const notFoundMiddleware = (req, res) => {
  console.error(
    `You can't do a ${req.method} for ${req.url}`,
    JSON.stringify(["name", "message", "stack"]),
  );

  if (!res.headersSent) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(`You can't do a ${req.method} for ${req.url}`);
  }
};

module.exports = notFoundMiddleware;
