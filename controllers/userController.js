const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");

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
async function register(req, res, next) {
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
    console.log(error, "this is the error block");
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  try {
    // Create new user from body of request if they were submitted
    const hashed = await hashPassword(value.password);

    const sql = `
    INSERT INTO users (email, name, hashed_password)
    VALUES ($1, $2, $3)
    RETURNING id, email, name
  `;
    const result = await pool.query(sql, [value.email, value.name, hashed]);
    const newUser = result.rows[0];
    global.user_id = newUser.id; // After the registration step, the user is set to logged on.
    return res
      .status(StatusCodes.CREATED)
      .json({ name: newUser.name, email: newUser.email });
  } catch (e) {
    if (e.code === "23505") {
      // duplicate email
      return res.status(400).json({
        message: "Registration failed",
        details: ["Email already in use"],
      });
    }
    return next(e); // forward other errors
  }
}

// ************USER LOGON********************
async function logon(req, res, next) {
  if (!req.body) req.body = {};
  const { email, password } = req.body;

  // Check that email and password were submitted
  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Email and password are required to logon." });
  }

  // Find user in system by email in global.users
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  // If no email found, then return as unauthorized
  if (result.rows.length === 0) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Authentication Failed" });
  }

  // If user is found, then connect credentials entered with user found in the system
  const foundUser = result.rows[0];

  //const passwordFromReq = password;

  // Compare passwords to make sure they match
  const match = await comparePassword(password, foundUser.hashed_password);
  if (!match) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Authentication Failed" });
  } else {
    // If successful, make the user logged in and the current user
    global.user_id = foundUser.id;
    return res.status(StatusCodes.OK).json({ name: foundUser.name });
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
