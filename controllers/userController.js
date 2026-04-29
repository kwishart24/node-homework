const { StatusCodes } = require("http-status-codes");

function register(req, res, body) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Name, email, and password are all required." });
  }
  const newUser = { ...req.body }; // this makes a copy
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  console.log(req.body);
  res
    .status(StatusCodes.CREATED)
    .json({ name: newUser.name, email: newUser.email });
}

module.exports = { register };
