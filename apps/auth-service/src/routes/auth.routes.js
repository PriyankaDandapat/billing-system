const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateSignup } = require("../validators/auth.validator");
const { protect } = require("../middleware/auth.middleware");

router.get("/hello", (req, res) => {
  res.json({ message: "Hello world" });
});
router.post("/signup", validateSignup, authController.signup);
router.post("/login", authController.login);
router.post("/refresh", protect,authController.refreshToken);
router.post("/logout", protect, authController.logout);

module.exports = router;
