const express = require("express");

const router = express.Router();
const {
  register,
  logon,
  logoff,
  userShow,
} = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

//*******REGISTER SWAGGER COMMENTS******** */
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Deere
 *               email:
 *                 type: string
 *                 example: jdeere@example.com
 *               password:
 *                 type: string
 *                 example: Pa$$word20
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation or reCAPTCHA failure
 */

router.route("/register").post(register);

//*******LOGON SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/users/logon:
 *   post:
 *     summary: Log in a user and return authentication cookie
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: jdeere@example.com
 *               password:
 *                 type: string
 *                 example: Pa$$word20
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials or validation error
 *       401:
 *         description: Unauthorized
 */

router.route("/logon").post(logon);

//*******LOGOFF SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/users/logoff:
 *   post:
 *     summary: Log out the current user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged off successfully
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */

router.route("/logoff").post(jwtMiddleware, logoff);

//*******GET USER BU ID SWAGGER COMMENTS******** */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user's information by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       404:
 *         description: User not found
 */

router.route("/:id").get(userShow);

module.exports = router;
