const { StatusCodes } = require("http-status-codes");

Function((req, res, next) => {
  if (global.use_id === null) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ meessage: "unauthorized" });
  }
  next();
});
