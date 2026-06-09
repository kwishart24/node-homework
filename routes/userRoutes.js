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
router.post("/register", register);

router.route("/register").post(register);
router.route("/logon").post(logon);
router.route("/logoff").post(jwtMiddleware, logoff);
router.route("/:id").get(userShow);

module.exports = router;
