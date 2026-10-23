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
const consumer = kafka.consumer({ groupId: "subscription-payment-results" });
let producerConnected = false;
let consumerConnected = false;

const connectKafka = async () => {
  await producer.connect();
  producerConnected = true;

  await consumer.connect();
  consumerConnected = true;
  await consumer.subscribe({
    topic: process.env.KAFKA_PAYMENT_TOPIC || "payment-events",
    fromBeginning: process.env.KAFKA_FROM_BEGINNING !== "false",
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) {
        console.warn(`Ignoring empty Kafka message from ${topic}`);
        return;
      }

      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (error) {
        console.error(`Ignoring invalid JSON from ${topic}:`, error.message);
        return;
      }

      if (!["payment.succeeded", "payment.failed"].includes(event.eventType)) {
        return;
      }

      if (
        typeof event.subscriptionId !== "string" ||
        typeof event.userId !== "string"
      ) {
        console.warn(
          `Ignoring malformed ${event.eventType} event from ${topic} partition ${partition}`,
        );
        return;
      }

      try {
        const subscriptionService = require("../services/subscription.service");
        const result = await subscriptionService.handlePaymentResult(event);
        console.log(
          `Processed ${event.eventType} for subscription ${event.subscriptionId}; status: ${result?.status ?? "not found"}`,
        );
      } catch (error) {
        console.error(`Failed to process ${event.eventType} event:`, error);
        throw error;
      }
    },
  });
};

const disconnectKafka = async () => {
  if (consumerConnected) {
    consumerConnected = false;
    await consumer.disconnect();
  }
  if (producerConnected) {
    producerConnected = false;
    await producer.disconnect();
  }
};

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
