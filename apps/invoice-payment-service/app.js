const express = require("express");
const invoiceRoutes = require("./src/routes/invoice.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "invoice-payment-service" });
});

app.use("/api/invoices", invoiceRoutes);

module.exports = app;
