const express = require("express");

const router = express.Router();
const {
  register,
  logon,
  logoff,
  userShow,
} = require("../controllers/userController");

router.route("/register").post(register);
router.route("/logon").post(logon);
router.route("/logoff").post(logoff);
router.route("/:id").get(userShow);

module.exports = router;
