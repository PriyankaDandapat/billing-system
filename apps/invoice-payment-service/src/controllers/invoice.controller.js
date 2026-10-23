const invoiceService = require("../services/invoice.service");

exports.listInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.listUserInvoices(req.user.id);
    return res.json({ invoices });
  } catch (error) {
    console.error("Failed to list invoices:", error);
    return res.status(500).json({ message: "Failed to list invoices" });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.getUserInvoice(
      req.user.id,
      req.params.invoiceId,
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json({ invoice });
  } catch (error) {
    console.error("Failed to get invoice:", error);
    return res.status(500).json({ message: "Failed to get invoice" });
  }
};

exports.listPaymentAttempts = async (req, res) => {
  try {
    const paymentAttempts = await invoiceService.listUserPaymentAttempts(
      req.user.id,
      req.params.invoiceId,
    );

    if (paymentAttempts === null) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json({ paymentAttempts });
  } catch (error) {
    console.error("Failed to list payment attempts:", error);
    return res.status(500).json({ message: "Failed to list payment attempts" });
  }
};

exports.createPaymentAttempt = async (req, res) => {
  const mockResult = req.body?.mockResult;

  if (!["SUCCESS", "FAILURE"].includes(mockResult)) {
    return res.status(400).json({
      message: 'mockResult must be either "SUCCESS" or "FAILURE"',
    });
  }

  try {
    const result = await invoiceService.createMockPaymentAttempt(
      req.user.id,
      req.params.invoiceId,
      mockResult,
    );

    if (!result) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.status(201).json({
      message:
        result.paymentAttempt.status === "SUCCEEDED"
          ? "Mock payment succeeded"
          : "Mock payment failed",
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Failed to create payment attempt:", error);
    return res.status(500).json({ message: "Failed to create payment attempt" });
  }
};
