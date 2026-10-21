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
