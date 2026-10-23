const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "subscription-service",
  brokers: (
    process.env.KAFKA_BROKERS ||
    process.env.KAFKA_BROKER ||
    "localhost:9092"
  )
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean),
});

const producer = kafka.producer();

const connectKafka = () => producer.connect();
const disconnectKafka = () => producer.disconnect();

const publishSubscriptionCreate = async (subscription) => {
  await producer.send({
    topic: "subscription-events",
    messages: [
      {
        key: subscription.id,
        value: JSON.stringify({
          eventType: "subscription.created",
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          price: subscription.price,
          currency: subscription.currency,
          billingInterval: subscription.billingInterval,
          startDate: subscription.startDate,
          currentPeriodEnd: subscription.currentPeriodEnd,
          createdAt: subscription.createdAt,
        }),
      },
    ],
  });
};

module.exports = {
  connectKafka,
  disconnectKafka,
  publishSubscriptionCreate,
};
