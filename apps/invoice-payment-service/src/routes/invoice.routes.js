const express = require("express");
const invoiceController = require("../controllers/invoice.controller");
const { protect } = require("../../../auth-service/src/middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", invoiceController.listInvoices);
router.get("/:invoiceId/payment-attempts", invoiceController.listPaymentAttempts);
router.post("/:invoiceId/payment-attempts", invoiceController.createPaymentAttempt);
router.get("/:invoiceId", invoiceController.getInvoice);

module.exports = router;
