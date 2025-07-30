import * as amqp from "amqplib";
import { logger } from "../utils/app-logger";
import type {
  ParseResultMessage,
  ParsingStatus
} from "../types/parse-queue.types";

// Define custom types for amqplib to avoid type errors
interface AmqpConnection {
  createChannel(): Promise<AmqpChannel>;
  on(event: string, listener: (arg: Error) => void): void;
  close(): Promise<void>;
}

interface AmqpChannel {
  prefetch(count: number): Promise<void>;
  assertQueue(
    queue: string,
    options?: QueueOptions
  ): Promise<QueueAssertResult>;
  consume(
    queue: string,
    onMessage: (msg: amqp.ConsumeMessage | null) => void,
    options?: ConsumeOptions
  ): Promise<ConsumeResult>;
  cancel(consumerTag: string): Promise<void>;
  ack(message: amqp.ConsumeMessage): void;
  nack(
    message: amqp.ConsumeMessage,
    allUpTo?: boolean,
    requeue?: boolean
  ): void;
  sendToQueue(
    queue: string,
    content: Buffer,
    options?: MessageOptions
  ): boolean;
  checkQueue(queue: string): Promise<QueueAssertResult>;
  close(): Promise<void>;
}

interface QueueOptions {
  exclusive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, unknown>;
  messageTtl?: number;
  expires?: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  maxLength?: number;
  maxPriority?: number;
}

interface QueueAssertResult {
  queue: string;
  messageCount: number;
  consumerCount: number;
}

interface ConsumeOptions {
  consumerTag?: string;
  noLocal?: boolean;
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  arguments?: Record<string, unknown>;
}

interface ConsumeResult {
  consumerTag: string;
}

interface MessageOptions {
  expiration?: string | number;
  userId?: string;
  priority?: number;
  persistent?: boolean;
  deliveryMode?: number;
  mandatory?: boolean;
  contentType?: string;
  contentEncoding?: string;
  headers?: Record<string, unknown>;
  correlationId?: string;
  replyTo?: string;
  messageId?: string;
  timestamp?: number;
  type?: string;
  appId?: string;
}

/**
 * Parse Queue Configuration
 */
interface ParseQueueConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  parsedQueueName: string;
  errorQueueName: string;
  prefetchCount: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Default parse queue configuration
 */
const DEFAULT_PARSE_QUEUE_CONFIG: ParseQueueConfig = {
  host: process.env.RABBITMQ_HOST || "eggo-rabbitmq",
  port: parseInt(process.env.RABBITMQ_PORT || "5672"),
  username: process.env.RABBITMQ_USER || "test",
  password: process.env.RABBITMQ_PASSWORD || "test",
  parsedQueueName: "parsed_queue",
  errorQueueName: "parsed_save_failed",
  prefetchCount: parseInt(process.env.PARSE_PREFETCH_COUNT || "5"),
  retryAttempts: parseInt(process.env.PARSE_RETRY_ATTEMPTS || "3"),
  retryDelay: parseInt(process.env.PARSE_RETRY_DELAY || "5000")
};

/**
 * Parsed Queue Consumer Service
 * Processes messages from PARSED_QUEUE and handles parsed demo data
 */
export class ParsedQueueConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private config: ParseQueueConfig;
  private isProcessing = false;
  private processedCount = 0;
  private errorCount = 0;
  private isConnected = false;
  private consumerTag: string | null = null;

  constructor(config: Partial<ParseQueueConfig> = {}) {
    this.config = { ...DEFAULT_PARSE_QUEUE_CONFIG, ...config };
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      const connectionUrl = `amqp://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}`;

      logger.info("Connecting to RabbitMQ for parsed queue consumer", {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username
      });

      this.connection = (await amqp.connect(
        connectionUrl
      )) as unknown as AmqpConnection;

      if (this.connection) {
        this.channel = await this.connection.createChannel();

        // Set prefetch to control concurrent processing
        await this.channel.prefetch(this.config.prefetchCount);

        // Ensure queues exist - use checkQueue first to see if they exist
        try {
          await this.channel.checkQueue(this.config.parsedQueueName);
          logger.info(
            "Parsed queue already exists, using existing configuration"
          );
        } catch (_error) {
          // Queue doesn't exist, create it with our preferred settings
          await this.channel.assertQueue(this.config.parsedQueueName, {
            durable: true,
            arguments: {
              "x-message-ttl": 3600000, // 1 hour TTL
              "x-dead-letter-exchange": "dlx", // Dead letter exchange
              "x-dead-letter-routing-key": "failed"
            }
          });
          logger.info("Created parsed queue with durable settings");
        }

        try {
          await this.channel.checkQueue(this.config.errorQueueName);
          logger.info(
            "Error queue already exists, using existing configuration"
          );
        } catch (_error) {
          // Queue doesn't exist, create it with our preferred settings
          await this.channel.assertQueue(this.config.errorQueueName, {
            durable: true
          });
          logger.info("Created error queue with durable settings");
        }

        logger.info(
          "Successfully connected to RabbitMQ for parsed queue consumer",
          {
            parsedQueue: this.config.parsedQueueName,
            errorQueue: this.config.errorQueueName,
            prefetchCount: this.config.prefetchCount
          }
        );

        // Handle connection events
        this.connection.on("error", (error: Error) => {
          logger.error("RabbitMQ connection error", error);
          this.isConnected = false;
        });

        this.connection.on("close", () => {
          logger.warn("RabbitMQ connection closed");
          this.connection = null;
          this.channel = null;
          this.isConnected = false;
        });

        this.isConnected = true;
      }
    } catch (error) {
      logger.error(
        "Failed to connect to RabbitMQ for parsed queue consumer",
        error
      );
      throw error;
    }
  }

  /**
   * Start consuming messages from PARSED_QUEUE
   */
  async startConsumer(): Promise<void> {
    if (!this.channel) {
      throw new Error("Not connected to RabbitMQ. Call connect() first.");
    }

    if (this.isProcessing) {
      logger.warn("Parsed queue consumer is already running");
      return;
    }

    this.isProcessing = true;

    logger.info("Starting parsed queue consumer", {
      queue: this.config.parsedQueueName,
      prefetchCount: this.config.prefetchCount
    });

    const consumeResult = await this.channel.consume(
      this.config.parsedQueueName,
      async (msg: amqp.ConsumeMessage | null) => {
        if (msg) {
          await this.processMessage(msg);
        }
      },
      { noAck: false }
    );

    this.consumerTag = consumeResult.consumerTag;

    logger.info("Parsed queue consumer started successfully");
  }

  /**
   * Stop consuming messages
   */
  async stopConsumer(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;

    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
      this.consumerTag = null;
    }

    logger.info("Parsed queue consumer stopped");
  }

  /**
   * Process a single message from the queue
   */
  private async processMessage(msg: amqp.ConsumeMessage): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    const startTime = Date.now();
    let status: ParsingStatus = "failed";
    const errors: string[] = [];
    let message: ParseResultMessage | undefined;

    try {
      // Parse message
      message = JSON.parse(msg.content.toString()) as ParseResultMessage;

      logger.info("Processing parsed demo data", {
        gameId: message.game_id,
        status: message.status,
        processedAt: message.processed_at,
        workerId: message.worker_id,
        processingDuration: message.processing_duration
      });

      // Step 1: Validate the parsed data
      if (!message.parsed_payload) {
        errors.push("Missing parsed payload in message");
        throw new Error("Invalid parsed data structure");
      }

      // Step 2: Process the parsed demo data
      await this.processParsedDemoData(message);

      status = "success";
      const processingTime = Date.now() - startTime;

      logger.info("Successfully processed parsed demo data", {
        gameId: message.game_id,
        status,
        processingTime,
        totalProcessed: this.processedCount
      });

      // Acknowledge message
      this.channel.ack(msg);
      this.processedCount++;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);

      logger.error("Failed to process parsed demo data", {
        gameId: message?.game_id,
        status,
        processingTime,
        error: errorMessage,
        errors
      });

      // Send error to error queue
      try {
        await this.publishError(message, errors, {
          processingTime,
          errorDetails:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack
                }
              : String(error)
        });
      } catch (publishError) {
        logger.error("Failed to publish error to error queue", publishError);
      }

      // Reject message and requeue for retry
      this.channel.nack(msg, false, true);
      this.errorCount++;
    }
  }

  /**
   * Process the parsed demo data
   */
  private async processParsedDemoData(
    message: ParseResultMessage
  ): Promise<void> {
    const { game_id, parsed_payload, processing_duration } = message;

    console.log("message", message);
    if (!parsed_payload) {
      throw new Error("Missing parsed payload");
    }

    // TODO: Implement your demo data processing logic here
    // This is where you would:
    // 1. Extract relevant data from parsed_payload
    // 2. Update database with parsed information
    // 3. Trigger any follow-up processes
    // 4. Send notifications if needed

    logger.info("Processing parsed demo data for game", {
      gameId: game_id,
      parsedPayloadKeys: Object.keys(parsed_payload),
      processingDuration: processing_duration
    });

    // Example processing steps:
    // await updateGameWithParsedData(game_id, parsed_payload);
    // await triggerFollowUpProcesses(game_id);
    // await sendNotifications(game_id, parsed_payload);
  }

  /**
   * Publish error to error queue
   */
  private async publishError(
    originalMessage: ParseResultMessage | undefined,
    errors: string[],
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("No channel available");
    }

    const errorMessage = {
      game_id: originalMessage?.game_id || "unknown",
      timestamp: new Date().toISOString(),
      errors,
      details,
      source: "parsed-queue-consumer",
      metadata: {
        processor: "parsed-queue-consumer",
        version: "1.0.0"
      }
    };

    const messageBuffer = Buffer.from(JSON.stringify(errorMessage));

    await this.channel.sendToQueue(this.config.errorQueueName, messageBuffer, {
      persistent: true
    });

    logger.debug("Error sent to error queue", {
      gameId: originalMessage?.game_id,
      errorCount: errors.length,
      queue: this.config.errorQueueName
    });
  }

  /**
   * Get consumer statistics
   */
  getStats(): {
    isProcessing: boolean;
    processedCount: number;
    errorCount: number;
    isConnected: boolean;
  } {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      isConnected: this.isConnected
    };
  }

  /**
   * Health check for the consumer
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.channel) {
        return false;
      }

      // Check if channel is still open
      await this.channel.checkQueue(this.config.parsedQueueName);
      return true;
    } catch (error) {
      logger.error("Health check failed for parsed queue consumer", error);
      return false;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isProcessing) {
        await this.stopConsumer();
      }

      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      logger.info("Disconnected from RabbitMQ for parsed queue consumer");
    } catch (error) {
      logger.error("Error disconnecting from RabbitMQ", error);
      throw error;
    }
  }
}
