const { StatusCodes } = require("http-status-codes");

function register(req, res, body) {
  const newUser = { ...req.body }; // this makes a copy
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  const name = req.body.name;
  const email = req.body.email;
  console.log(req.body);
  res
    .status(StatusCodes.CREATED)
    .json({ name: newUser.name, email: newUser.email });
}

module.exports = { register };
