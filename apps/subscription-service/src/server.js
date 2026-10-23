require("dotenv").config();
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const { connectKafka, disconnectKafka } = require("./config/kafka");

const PORT = process.env.PORT || 3002;
let server;
let shuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();
    await connectKafka();
    server = app.listen(PORT, () => {
      console.log(`Subscription service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start subscription service:", error);
    await disconnectKafka();
    await disconnectDB();
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down subscription service`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectKafka();
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
