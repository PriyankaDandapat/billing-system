require("dotenv").config();
const { connectDB, disconnectDB } = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  connectDB();
  console.log(`Auth Service running on port ${process.env.PORT || 3001}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
