const express = require("express");
const subscriptionController = require("../controllers/subscription.controller");
const {
  protect,
} = require("../../../auth-service/src/middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, subscriptionController.createSubscription);
router.get("/", protect, subscriptionController.listUserSubscriptions);
router.get("/:id", protect, subscriptionController.getUserSubscription);

module.exports = router;
