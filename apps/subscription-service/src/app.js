const express = require("express");
const planRoutes = require("./routes/plan.routes");
const subscriptionRoutes = require("./routes/subscription.routes");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "subscription-service" });
});

app.use("/api/plans", planRoutes);
app.use("/api/subscription", subscriptionRoutes);

module.exports = app;
