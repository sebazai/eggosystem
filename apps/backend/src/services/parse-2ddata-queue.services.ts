import amqp from "amqplib";
import { logger } from "../utils/app-logger";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "eggo-rabbitmq";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "/";

const PARSE_2DDATA_QUEUE = "parse_2ddata";

const getConnectionUri = () => {
  if (RABBITMQ_VHOST === "/") {
    return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
  }
  return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`;
};

const createChannel = async () => {
  const connection = await amqp.connect(getConnectionUri());
  const channel = await connection.createChannel();
  await channel.assertQueue(PARSE_2DDATA_QUEUE, { durable: true });
  return { connection, channel };
};

export const publishToParse2ddataQueue = async (
  payload: Record<string, unknown>
): Promise<void> => {
  let connection: amqp.ChannelModel | undefined;
  let channel: amqp.Channel | undefined;

  try {
    const resources = await createChannel();
    connection = resources.connection;
    channel = resources.channel;

    const message = Buffer.from(JSON.stringify(payload));
    const published = channel.sendToQueue(PARSE_2DDATA_QUEUE, message, {
      persistent: true,
      contentType: "application/json",
      messageId: `parse2d-${Date.now()}`,
      timestamp: Date.now()
    });

    if (!published) {
      throw new Error("Failed to publish message to parse_2ddata");
    }
  } catch (error) {
    logger.error("Error publishing message to parse_2ddata", { error });
    throw error;
  } finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
};
