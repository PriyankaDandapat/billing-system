const subscriptionService = require("../services/subscription.service");

exports.createSubscription = async (req, res) => {
  const { planId } = req.body;
  if (!planId || typeof planId !== "string") {
    return res.status(400).json({ message: "planId is required" });
  }

  try {
    const subscription = await subscriptionService.createSubscription(
      req.user.id,
      planId,
    );

    return res.status(201).json({ subscription });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.log("Failed to create subcription: ", error);
    return res.status(500).json({ message: "Failed to create subscription" });
  }
};

exports.listUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await subscriptionService.listUserSubscriptions(
      req.user.id,
    );
    return res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Failed to list subscriptions" });
    console.error("Failed to list subscriptions:", error);
  }
};

exports.getUserSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(
      req.user.id,
      req.params.id,
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    return res.json({ subscription });
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return res.status(500).json({ message: "Failed to get subscription" });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.cancelUserSubscription(
      req.user.id,
      req.params.id,
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    return res.json({ message: "Subscription cancelled", subscription });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return res.status(500).json({ message: "Failed to cancel subscription" });
  }
};
