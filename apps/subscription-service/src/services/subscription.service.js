const { prisma } = require("../config/db");

exports.createSubscription = async (userId, planId) => {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  //throw error if plan not found
  if (!plan || !plan.isActive) {
    const error = new Error("Plan not found or inactive");
    error.statusCode = 404;
    throw error;
  }

  //calculate plan duration
  const startDate = new Date();
  const currentPeriodEnd = new Date(startDate);

  if (plan.billingInterval === "MONTHLY") {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  } else if (plan.billingInterval === "YEARLY") {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  }

  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "PENDING_PAYMENT",
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        startDate,
        currentPeriodEnd,
      },
    });

    await tx.outboxEvent.create({
      data: {
        aggregateType: "subscription",
        aggregateId: subscription.id,
        type: "subscription.created",
        payload: {
          eventType: "subscription.created",
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          price: subscription.price,
          currency: subscription.currency,
          billingInterval: subscription.billingInterval,
          startDate: subscription.startDate.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          createdAt: subscription.createdAt.toISOString(),
        },
      },
    });

    return subscription;
  });
};

exports.handlePaymentResult = async (event) => {
  if (!event.subscriptionId || !event.userId) {
    throw new Error("Payment result event is missing subscription or user ID");
  }

  if (event.eventType === "payment.succeeded") {
    const result = await prisma.subscription.updateMany({
      where: {
        id: event.subscriptionId,
        userId: event.userId,
        status: "PENDING_PAYMENT",
      },
      data: { status: "ACTIVE" },
    });

    if (result.count === 1) {
      return { status: "ACTIVE", updated: true };
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: event.subscriptionId, userId: event.userId },
      select: { status: true },
    });

    return { status: subscription?.status ?? null, updated: false };
  }

  if (event.eventType === "payment.failed") {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: event.subscriptionId,
        userId: event.userId,
      },
      select: { status: true },
    });

    return { status: subscription?.status ?? null, updated: false };
  }

  return null;
};

exports.listUserSubscriptions = (userId) =>
  prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

exports.getUserSubscription = (userId, subscriptionId) =>
  prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    include: { plan: true },
  });

exports.cancelUserSubscription = async (userId, subscriptionId) => {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) return null;

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELLED" },
    include: { plan: true },
  });
};
