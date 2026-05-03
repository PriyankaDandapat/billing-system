const express = require("express");
const authRoutes = require("./routes/auth.routes");

const app = express();

// Body parsing middlwares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route the auth paths - API Routes
app.use("/api/auth", authRoutes);

module.exports = app;
