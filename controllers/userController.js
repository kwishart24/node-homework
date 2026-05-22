const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

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

  //Validate with Joi
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    //Hash password
    const hashedPassword = await hashPassword(value.password);
    // Create new user from body of request if they were submitted
    // value.hashed_password = await hashPassword(value.password);

    //Remove plain password
    delete value.password;

    // Create user with Prisma
    const user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email.toLowerCase(),
        hashedPassword: hashedPassword,
      },
      select: { id: true, name: true, email: true },
    });

    // Set global user id
    global.user_id = user.id;

    return res.status(StatusCodes.CREATED).json(user);
  } catch (err) {
    // Prisma duplicate email error
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({
        message: "Registration failed",
        details: ["Email already in use"],
      });
    }

    return next(err);
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
  try {
    const normalizedEmail = email.toLowerCase();

    const foundUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!foundUser) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Authentication failed" });
    }
    // Compare passwords to make sure they match
    const match = await comparePassword(password, foundUser.hashedPassword);
    if (!match) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Authentication failed" });
    }

    global.user_id = foundUser.id;
    return res.status(StatusCodes.OK).json({ name: foundUser.name });
  } catch (e) {
    return next(e);
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
