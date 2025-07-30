# Queue Consumer Startup Documentation

## Overview

The queue consumer system is designed to automatically start and manage RabbitMQ consumers when the backend application starts up. This ensures that the application can process messages from various queues without manual intervention.

## Architecture

### Queue Consumer Manager

The `QueueConsumerManager` class is responsible for:

- **Starting all queue consumers** on application startup
- **Stopping all queue consumers** gracefully on shutdown
- **Managing consumer lifecycle** and error handling
- **Providing status information** about running consumers

### Current Consumers

1. **ParsedQueueConsumer**: Processes parsed demo data from the `parsed_queue`
   - **Message Format**:
     ```json
     {
       "game_id": "123123",
       "demo_file": "/app/demos/parsed/1-94cbcea0-8389-4713-ac9d-e53d04514b29-1-1.dem.zip",
       "json_file": "/app/json/1-94cbcea0-8389-4713-ac9d-e53d04514b29-1-1.json",
       "processed_at": "2025-07-30T06:43:53Z",
       "processing_duration": 103,
       "worker_id": "worker_1753857705",
       "status": "completed",
       "parsed_payload": {
         /* parsed demo data */
       }
     }
     ```

## Startup Process

### 1. Application Initialization

When the backend application starts:

1. **Environment Check**: Queue consumers are only started in non-test environments
2. **Consumer Initialization**: Each consumer connects to RabbitMQ and starts processing
3. **Error Handling**: Failed consumer startups are logged but don't prevent the application from starting

### 2. Consumer Lifecycle

```typescript
// In app.ts
if (
  process.env.NODE_ENV !== "test" &&
  process.env.NODE_ENV !== "e2e" &&
  process.env.TEST_TYPE !== "e2e"
) {
  queueConsumerManager
    .startAllConsumers()
    .then(() => {
      logger.info("Queue consumers initialized successfully");
    })
    .catch((error) => {
      logger.error("Failed to initialize queue consumers:", error);
    });
}
```

### 3. Graceful Shutdown

The application handles shutdown signals (`SIGTERM`, `SIGINT`) to:

1. **Stop all consumers** gracefully
2. **Close server connections**
3. **Exit cleanly**

```typescript
// In server.ts
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await queueConsumerManager.stopAllConsumers();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
```

## Configuration

### Environment Variables

Queue consumers use the following environment variables:

```bash
# RabbitMQ Connection
RABBITMQ_HOST=eggo-rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=test
RABBITMQ_PASSWORD=test
RABBITMQ_VHOST=%2F

# Parsed Queue Consumer
PARSE_PREFETCH_COUNT=5
PARSE_RETRY_ATTEMPTS=3
PARSE_RETRY_DELAY=5000
```

### Queue Configuration

All queues are configured with:

- **Durability**: Survive server restarts
- **Message TTL**: 1 hour expiration
- **Dead Letter Exchange**: Failed messages sent to error queue
- **Prefetch**: Control concurrent message processing

## Adding New Consumers

To add a new queue consumer:

1. **Create the consumer class** extending the base pattern
2. **Add to QueueConsumerManager** in `startAllConsumers()`
3. **Update tests** to include the new consumer
4. **Document the consumer** in this file

### Example: Adding a New Consumer

```typescript
// 1. Create the consumer
export class NewQueueConsumer {
  async connect(): Promise<void> { /* ... */ }
  async startConsumer(): Promise<void> { /* ... */ }
  async stopConsumer(): Promise<void> { /* ... */ }
}

// 2. Add to QueueConsumerManager
async startAllConsumers(): Promise<void> {
  // ... existing consumers ...

  const newConsumer = new NewQueueConsumer();
  await newConsumer.connect();
  await newConsumer.startConsumer();
  this.consumers.push(newConsumer);
}
```

## Monitoring and Health Checks

### Consumer Status

The `QueueConsumerManager` provides status information:

```typescript
const status = queueConsumerManager.getConsumerStatus();
// Returns: { consumerCount: number, isShuttingDown: boolean }
```

### Health Check Endpoint

Consider adding a health check endpoint to monitor consumer status:

```typescript
app.get("/health/consumers", (req, res) => {
  const status = queueConsumerManager.getConsumerStatus();
  res.json(status);
});
```

## Error Handling

### Consumer Failures

- **Connection failures** are logged and don't prevent application startup
- **Processing errors** are handled by individual consumers
- **Graceful degradation** ensures the application continues running
- **Queue compatibility** handles existing queues with different configurations

### Recovery

- **Automatic reconnection** attempts for failed consumers
- **Message acknowledgment** prevents message loss
- **Error queues** capture failed messages for analysis
- **Queue detection** checks if queues exist before creating them with specific settings

## Testing

### Unit Tests

Queue consumer manager tests verify:

- ✅ Consumer startup and shutdown
- ✅ Error handling during startup
- ✅ Graceful shutdown behavior
- ✅ Status reporting

### Integration Tests

For full integration testing:

1. **Start RabbitMQ** in test environment
2. **Publish test messages** to queues
3. **Verify message processing** by consumers
4. **Test error scenarios** and recovery

## Troubleshooting

### Common Issues

1. **Consumer not starting**: Check RabbitMQ connection and environment variables
2. **Messages not processed**: Verify queue configuration and consumer logic
3. **Memory leaks**: Ensure proper consumer cleanup on shutdown
4. **Queue configuration conflicts**: The system now handles existing queues gracefully

### Debugging

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

Check consumer logs for connection and processing information.
