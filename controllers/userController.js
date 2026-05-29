const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
//const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

// **************SETTING THE COOKIE***********
const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

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

  // Validate with Joi
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    // Hash password
    const hashedPassword = await hashPassword(value.password);
    delete value.password;

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name: value.name,
          email: value.email.toLowerCase(),
          hashedPassword: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // Welcome tasks
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        {
          title: "Add your first task",
          userId: newUser.id,
          priority: "high",
        },
        {
          title: "Explore the app",
          userId: newUser.id,
          priority: "low",
        },
      ];

      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch created tasks
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    // Set global user id
    //global.user_id = result.user.id;

    const csrfToken = setJwtCookie(req, res, result.user);

    // Return response
    return res.status(201).json({
      user: result.user.name,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
      csrfToken,
    });
  } catch (err) {
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

    //global.user_id = foundUser.id;

    const csrfToken = setJwtCookie(req, res, foundUser);

    return res.status(StatusCodes.OK).json({ name: foundUser.name }, csrfToken);
  } catch (e) {
    return next(e);
  }
}

// ************USER SHOW METHOD********************
async function userShow(req, res) {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
}

// ************USER LOGOFF********************
function logoff(req, res) {
  //global.user_id = null;
  res.clearCookie("jwt", cookieFlags(req));
  return res
    .status(StatusCodes.OK)
    .json({ message: "Logged off successfully." });
}

module.exports = { register, logon, logoff, userShow };
