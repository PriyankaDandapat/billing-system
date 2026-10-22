require("dotenv").config();

const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");

const PORT = process.env.PORT || 3003;
let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Billing/payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start billing/payment service:", error);
    await disconnectDB();
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down billing/payment service`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
