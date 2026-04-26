import { logger } from "../utils/app-logger";

const RABBITMQ_MANAGEMENT_BASE_URL = process.env.RABBITMQ_HOST
  ? `https://${process.env.RABBITMQ_HOST}/api`
  : "https://hubdev-mq.kanaliiga.fi/api";

const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";
const RABBITMQ_VHOST_RAW = process.env.RABBITMQ_VHOST || "/";

const getVhostEncoded = () => {
  const decoded =
    RABBITMQ_VHOST_RAW.includes("%") || RABBITMQ_VHOST_RAW.includes("%2F")
      ? decodeURIComponent(RABBITMQ_VHOST_RAW)
      : RABBITMQ_VHOST_RAW;
  // RabbitMQ management expects vhost path segment URL-encoded ("/" -> "%2F")
  return encodeURIComponent(decoded);
};

const authHeader = () => {
  const token = Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASSWORD}`).toString(
    "base64"
  );
  return `Basic ${token}`;
};

interface RabbitMqManagementQueueInfo {
  name: string;
  vhost: string;
  messages: number;
}

interface RabbitMqManagementGetMessage {
  payload: string;
  payload_bytes: number;
  redelivered: boolean;
  properties: Record<string, unknown>;
  message_count: number;
}

export const getQueueInfo = async (
  queueName: string
): Promise<RabbitMqManagementQueueInfo> => {
  const vhost = getVhostEncoded();
  const url = `${RABBITMQ_MANAGEMENT_BASE_URL}/queues/${vhost}/${encodeURIComponent(queueName)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authHeader()
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error("RabbitMQ management queue info failed", {
      queueName,
      status: res.status,
      body: text
    });
    throw new Error(`RabbitMQ management queue info failed: ${res.status}`);
  }

  const data = (await res.json()) as RabbitMqManagementQueueInfo;
  return data;
};

export const getMessagesFromQueue = async (
  queueName: string,
  count: number,
  truncate: number = 50000
): Promise<RabbitMqManagementGetMessage[]> => {
  const vhost = getVhostEncoded();
  const url = `${RABBITMQ_MANAGEMENT_BASE_URL}/queues/${vhost}/${encodeURIComponent(queueName)}/get`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      count,
      ackmode: "ack_requeue_true",
      encoding: "auto",
      truncate
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error("RabbitMQ management get messages failed", {
      queueName,
      status: res.status,
      body: text
    });
    throw new Error(`RabbitMQ management get messages failed: ${res.status}`);
  }

  const data = (await res.json()) as RabbitMqManagementGetMessage[];
  return data;
};
