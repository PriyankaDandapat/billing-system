const { prisma } = require("../config/db");
const { publishSubscriptionCreate } = require("../config/kafka");

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

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      price: plan.price,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      startDate,
      currentPeriodEnd,
    },
  });

  await publishSubscriptionCreate(subscription);
  return subscription;
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
