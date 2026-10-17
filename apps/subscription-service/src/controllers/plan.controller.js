const planService = require("../services/plan.service");

exports.listActivePlans = async (req, res) => {
  try {
    const plans = await planService.listActivePlans();
    res.json({ plans });
  } catch (error) {
    console.error("failed to fetch plans : ", error);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
};
