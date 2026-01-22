const amqp = require("amqplib");
const logger = require("../utils/logger");

const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EXCHANGE = "email.events";
const RETRY_INTERVAL = 5000;

let connection;
let channel;

async function connectWithRetry() {
  while (true) {
    try {
      connection = await amqp.connect(RABBIT_URL);

      connection.on("error", (err) => {
        logger.error("RabbitMQ connection error", err);
        connection = null;
        channel = null;
      });

      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed");
        connection = null;
        channel = null;
      });

      channel = await connection.createConfirmChannel();
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });

      logger.info("RabbitMQ publisher connected");
      return channel;
    } catch (err) {
      logger.warn("RabbitMQ not ready, retrying...");
      await new Promise((res) => setTimeout(res, RETRY_INTERVAL));
    }
  }
}

async function getChannel() {
  if (channel) return channel;
  return connectWithRetry();
}

async function publishEmailEvent(event) {
  const ch = await getChannel();

  return new Promise((resolve, reject) => {
    ch.publish(
      EXCHANGE,
      "email.send",
      Buffer.from(JSON.stringify(event)),
      { persistent: true },
      (err) => {
        if (err) {
          logger.error("Failed to publish email event", err);
          return reject(err);
        }

        logger.info("Email event published", {
          type: event.type,
          to: event.to,
        });

        resolve();
      },
    );
  });
}

module.exports = { publishEmailEvent };
