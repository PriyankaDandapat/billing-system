const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.get("/hello", (req, res) => {
  res.json({ message: "Hello world" });
});
router.post("/signup", authController.signup);
router.post("/login", authController.login);

module.exports = router;
