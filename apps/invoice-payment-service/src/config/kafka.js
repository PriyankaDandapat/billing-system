const { Kafka } = require("kafkajs");

const brokers = (
  process.env.KAFKA_BROKERS ||
  process.env.KAFKA_BROKER ||
  "localhost:9092"
)
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: "invoice-payment-service",
  brokers,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "invoice-payment-service" });
let connected = false;
let producerConnected = false;

const connectProducer = async () => {
  await producer.connect();
  producerConnected = true;
};

const disconnectProducer = async () => {
  if (!producerConnected) return;
  producerConnected = false;
  await producer.disconnect();
};

const publishPaymentResult = async ({ paymentAttempt, invoice }) => {
  const eventType =
    paymentAttempt.status === "SUCCEEDED"
      ? "payment.succeeded"
      : "payment.failed";

  await producer.send({
    topic: process.env.KAFKA_PAYMENT_TOPIC || "payment-events",
    messages: [
      {
        // Keep payment-result events for the same subscription on the same partition.
        key: invoice.subscriptionId,
        value: JSON.stringify({
          eventType,
          paymentAttemptId: paymentAttempt.id,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscriptionId,
          userId: invoice.userId,
          amount: paymentAttempt.amount,
          currency: paymentAttempt.currency,
          occurredAt: paymentAttempt.completedAt,
        }),
      },
    ],
  });
};

const isValidSubscriptionEvent = (event) => {
  const validDate = (value) =>
    typeof value === "string" && !Number.isNaN(new Date(value).getTime());

  return (
    event &&
    event.eventType === "subscription.created" &&
    typeof event.subscriptionId === "string" &&
    typeof event.userId === "string" &&
    typeof event.currency === "string" &&
    Number.isInteger(event.price) &&
    ["MONTHLY", "YEARLY"].includes(event.billingInterval) &&
    validDate(event.startDate) &&
    validDate(event.currentPeriodEnd)
  );
};

const connectConsumer = async () => {
  await consumer.connect();
  connected = true;

  await consumer.subscribe({
    topic: process.env.KAFKA_SUBSCRIPTION_TOPIC || "subscription-events",
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

      if (event.eventType !== "subscription.created") return;

      if (!isValidSubscriptionEvent(event)) {
        console.warn(
          `Ignoring malformed subscription.created event from ${topic} partition ${partition}`,
        );
        return;
      }

      try {
        const invoiceService = require("../services/invoice.service");
        const invoice = await invoiceService.createInvoiceFromSubscriptionEvent(
          event,
        );
        console.log(
          `Processed subscription.created; invoice ${invoice.invoiceNumber} is ${invoice.status} (partition ${partition})`,
        );
      } catch (error) {
        // Rethrow processing errors so KafkaJS does not treat the event as handled.
        console.error("Failed to process subscription.created event:", error);
        throw error;
      }
    },
  });
};

const disconnectConsumer = async () => {
  if (!connected) return;
  connected = false;
  await consumer.disconnect();
};

module.exports = {
  connectConsumer,
  disconnectConsumer,
  connectProducer,
  disconnectProducer,
  publishPaymentResult,
};
