const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");

// **************HASHING PASSWORDS***********
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// **************REGISTRATION*****************
async function register(req, res, body) {
  if (!req.body) req.body = {};

  const { name, email, password } = req.body;

  // Check that name, email, password were submitted
  if (!name || !email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Name, email, and password are all required." });
  }

  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  // Create new user from body of request if they were submitted
  const hashed = await hashPassword(value.password);
  //const newUser = { ...req.body }; // this makes a copy
  const newUser = { ...value, hashed };
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  //delete value.password;
  res
    .status(StatusCodes.CREATED)
    .json({ name: newUser.name, email: newUser.email });
}

// ************USER LOGON********************
async function logon(req, res, body) {
  const { email, password } = req.body;

  // Check that email and password were submitted
  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Email and password are required to logon." });
  }

  // Find user in system by email in global.users
  const logonRequester = global.users.find((u) => u.email === email);

  // If no email found, then return as unauthorized
  if (logonRequester === undefined) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Authenication Failed" });
  }

  // If user is found, then connect credentials entered with user found in the system
  const foundUser = logonRequester;

  //const passwordFromReq = password;

  // Compare passwords to make sure they match
  const match = await comparePassword(password, foundUser.hashed);
  if (!match) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Authentication Failed" });
  } else {
    // If successful, make the user logged in and the current user
    global.user_id = foundUser.id;
    return res
      .status(StatusCodes.OK)
      .json({ name: foundUser.name, email: foundUser.email });
  }
}

// ************USER LOGOFF********************
function logoff(req, res) {
  global.user_id = null;
  return res
    .status(StatusCodes.OK)
    .json({ message: "Logged off successfully." });
}

module.exports = { register, logon, logoff };
