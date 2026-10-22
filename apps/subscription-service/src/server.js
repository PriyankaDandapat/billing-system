require("dotenv").config();
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const { connectKafka, disconnectKafka } = require("./config/kafka");

const PORT = process.env.PORT || 3002;

// const server = app.listen(PORT, () => {
//   connectDB();
//   console.log(`subscription service running on port ${PORT}`);
// });

const startServer = async () => {
  try {
    await connectDB();
    await connectKafka();
    app.listen(PORT, () => {
      console.log(`Subscription service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start subscription service:", error);
    process.exit(1);
  }
};

startServer();

process.on("onhandleRejection", (err) => {
  console.error("Unhandled Rejection", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    await disconnectKafka;
    process.exit(0);
  });
});
