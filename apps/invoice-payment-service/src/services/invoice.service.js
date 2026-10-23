const { prisma } = require("../config/db");

const supportedIntervals = new Set(["MONTHLY", "YEARLY"]);

exports.createInvoiceFromSubscriptionEvent = async (event) => {
  const requiredStrings = ["subscriptionId", "userId", "currency"];
  if (
    requiredStrings.some(
      (field) => typeof event[field] !== "string" || !event[field].trim(),
    ) ||
    !Number.isInteger(event.price) ||
    !supportedIntervals.has(event.billingInterval)
  ) {
    throw new Error("Invalid subscription.created event payload");
  }

  const periodStart = new Date(event.startDate);
  const periodEnd = new Date(event.currentPeriodEnd);
  const dueAt = new Date(event.createdAt || event.startDate);

  if (
    Number.isNaN(periodStart.getTime()) ||
    Number.isNaN(periodEnd.getTime()) ||
    Number.isNaN(dueAt.getTime())
  ) {
    throw new Error("Subscription event contains invalid dates");
  }

  const invoiceNumber = `INV-${event.subscriptionId}-${periodStart.getTime()}`;

  // The compound unique key makes processing the same Kafka event safe to repeat.
  return prisma.invoice.upsert({
    where: {
      subscriptionId_periodStart: {
        subscriptionId: event.subscriptionId,
        periodStart,
      },
    },
    create: {
      invoiceNumber,
      userId: event.userId,
      subscriptionId: event.subscriptionId,
      amount: event.price,
      currency: event.currency,
      billingInterval: event.billingInterval,
      status: "OPEN",
      periodStart,
      periodEnd,
      dueAt,
    },
    update: {},
  });
};

exports.listUserInvoices = (userId) =>
  prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

exports.getUserInvoice = (userId, invoiceId) =>
  prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { paymentAttempts: { orderBy: { attemptNumber: "desc" } } },
  });

exports.listUserPaymentAttempts = async (userId, invoiceId) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: { id: true },
  });

  if (!invoice) return null;

  return prisma.paymentAttempt.findMany({
    where: { invoiceId: invoice.id, userId },
    orderBy: { attemptNumber: "desc" },
  });
};

exports.createMockPaymentAttempt = async (userId, invoiceId, mockResult) =>
  prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) return null;

    if (invoice.status !== "OPEN") {
      const error = new Error("Only open invoices can be paid");
      error.statusCode = 409;
      throw error;
    }

    const previousAttempts = await tx.paymentAttempt.count({
      where: { invoiceId: invoice.id },
    });
    const succeeded = mockResult === "SUCCESS";
    const completedAt = new Date();

    const paymentAttempt = await tx.paymentAttempt.create({
      data: {
        invoiceId: invoice.id,
        userId,
        amount: invoice.amount,
        currency: invoice.currency,
        attemptNumber: previousAttempts + 1,
        provider: "MOCK",
        status: succeeded ? "SUCCEEDED" : "FAILED",
        failureReason: succeeded ? null : "Mock payment declined",
        completedAt,
      },
    });

    const updatedInvoice = succeeded
      ? await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAID", paidAt: completedAt },
        })
      : invoice;

    return { paymentAttempt, invoice: updatedInvoice };
  });
