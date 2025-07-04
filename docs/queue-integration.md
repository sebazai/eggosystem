# CSRankker Queue Integration Documentation

## Overview

This document explains how the HUB service should integrate with the CSRankker microservice through RabbitMQ queues. CSRankker processes kanaelo calculations by consuming calculation requests and publishing results back to the HUB service.

## Queue Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HUB Service   │    │   CSRankker     │    │   HUB Service   │
│                 │    │   Service       │    │                 │
│ Publishes to    │───▶│                 │───▶│ Consumes from   │
│ kanaelo_calc_   │    │ Queue Consumer  │    │ kanaelo_save_   │
│ queue           │    │                 │    │ queue           │
│                 │    │ Result Producer │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## RabbitMQ Configuration

### Connection Details

- **Host**: `eggo-rabbitmq` (Docker network)
- **Port**: `5672`
- **Username**: `test`
- **Password**: `test`
- **Virtual Host**: `/` (default)

### Queue Configuration

Both queues should be declared with the following settings:

```javascript
const queueConfig = {
  durable: true, // Survive server restarts
  exclusive: false, // Allow multiple consumers
  autoDelete: false, // Don't delete when unused
  arguments: {
    "x-message-ttl": 3600000, // 1 hour TTL
    "x-dead-letter-exchange": "dlx", // Dead letter exchange
    "x-dead-letter-routing-key": "failed"
  }
};
```

## Queue 1: kanaelo_calc_queue (HUB → CSRankker)

### Purpose

HUB service publishes calculation requests to this queue when players need kanaelo calculations.

### Message Format

```json
{
  "steam_id": "string",
  "season_id": "string",
  "timestamp": "ISO 8601 datetime",
  "request_id": "string (optional)",
  "priority": "number (optional, 1-10)",
  "metadata": {
    "trigger": "match_completion | manual_calculation | season_update",
    "match_id": "string (optional)",
    "requested_by": "string (optional)"
  }
}
```

### Field Descriptions

- **steam_id** (required): Player's Steam ID in string format
- **season_id** (required): Season ID for the calculation
- **timestamp** (required): When the calculation was requested
- **request_id** (optional): Unique identifier for tracking the request
- **priority** (optional): Priority level (1=low, 10=high), defaults to 5
- **metadata** (optional): Additional context about the calculation request

### Publishing Example

```javascript
// Node.js example with amqplib
const message = {
  steam_id: "76561198123456789",
  season_id: "2024-spring",
  timestamp: new Date().toISOString(),
  request_id: "calc-req-12345",
  priority: 7,
  metadata: {
    trigger: "match_completion",
    match_id: "match-67890",
    requested_by: "match-processor"
  }
};

await channel.sendToQueue(
  "kanaelo_calc_queue",
  Buffer.from(JSON.stringify(message)),
  {
    persistent: true,
    priority: message.priority || 5,
    messageId: message.request_id,
    timestamp: Date.now()
  }
);
```

### When to Publish

1. **After match completion**: When a player finishes a match and needs rating update
2. **Manual calculation**: When admin triggers manual recalculation
3. **Season update**: When season data changes require recalculation
4. **Batch processing**: When processing multiple players (send individual messages)

### Error Handling

- **Invalid message format**: CSRankker will reject and send to dead letter queue
- **Missing required fields**: Message will be rejected
- **Invalid steam_id/season_id**: Will be processed but may result in calculation failure

## Queue 2: kanaelo_save_queue (CSRankker → HUB)

### Purpose

CSRankker publishes calculation results to this queue for HUB service to process and save.

### Message Format

```json
{
  "steam_id": "string",
  "season_id": "string",
  "calculation_result": {
    "kanaelo": "number",
    "before_stabilization": "number",
    "after_stabilization": "number",
    "adjustment_factor": "number"
  },
  "calculation_details": {
    "cs2_contribution": "number",
    "faceit_contribution": "number",
    "hours_contribution": "number",
    "previous_rating_contribution": "number",
    "league_tier_applied": "string | null"
  },
  "source_data": {
    "cs2_rank": "number | null",
    "faceit_level": "number | null",
    "faceit_elo": "number | null",
    "faceit_kd": "number | null",
    "hours_played": "number | null",
    "previous_kanaelo": "number | null",
    "previous_kanarating": "number | null"
  },
  "calculation_metadata": {
    "calculated_at": "ISO 8601 datetime",
    "calculation_id": "string",
    "processing_time_ms": "number",
    "csrankker_version": "string",
    "request_id": "string (if provided in original request)"
  },
  "status": "success | partial_success | failed",
  "errors": ["string"] // Array of error messages if any
}
```

### Field Descriptions

**Core Results**:

- **kanaelo**: Final calculated kanaelo rating
- **before_stabilization**: Raw calculated value before stabilization
- **after_stabilization**: Final value after stabilization (currently same as kanaelo)
- **adjustment_factor**: Stabilization adjustment factor (currently 1.0)

**Calculation Details**:

- **cs2_contribution**: Points contributed by CS2 rank (0-125)
- **faceit_contribution**: Points contributed by Faceit data (0-150)
- **hours_contribution**: Points contributed by hours played (0-25)
- **previous_rating_contribution**: Points contributed by previous ratings (0-100)
- **league_tier_applied**: League tier adjustment if applicable

**Source Data**:

- Raw data used for calculations (for audit/debugging)

**Metadata**:

- Processing information and tracking data

### Consumption Example

```javascript
// Node.js example with amqplib
await channel.consume(
  "kanaelo_save_queue",
  async (msg) => {
    if (msg) {
      try {
        const result = JSON.parse(msg.content.toString());

        // Process the calculation result
        await processKanaeloResult(result);

        // Acknowledge message
        channel.ack(msg);
      } catch (error) {
        console.error("Error processing kanaelo result:", error);

        // Reject and requeue for retry
        channel.nack(msg, false, true);
      }
    }
  },
  {
    noAck: false
  }
);

async function processKanaeloResult(result) {
  const { steam_id, season_id, calculation_result, status } = result;

  if (status === "success") {
    // Save the new kanaelo rating
    await savePlayerKanaelo(steam_id, season_id, calculation_result.kanaelo);

    // Update player statistics
    await updatePlayerStats(steam_id, season_id, result.calculation_details);

    // Log successful calculation
    console.log(
      `Kanaelo updated for ${steam_id}: ${calculation_result.kanaelo}`
    );
  } else {
    // Handle partial success or failure
    console.error(`Calculation failed for ${steam_id}:`, result.errors);
  }
}
```

### Processing Requirements

1. **Acknowledge messages**: Always acknowledge messages after successful processing
2. **Handle failures**: Implement retry logic for temporary failures
3. **Validate data**: Validate kanaelo values are within expected range (0-400)
4. **Audit logging**: Log all kanaelo updates for audit purposes
5. **Error handling**: Handle partial failures gracefully

### Status Types

- **success**: Calculation completed successfully
- **partial_success**: Calculation completed but some data was missing/estimated
- **failed**: Calculation failed (check errors array)

## Error Handling and Monitoring

### Dead Letter Queue

Both queues should be configured with dead letter exchange for failed messages:

```javascript
// Dead letter queue configuration
const deadLetterConfig = {
  exchange: "dlx",
  routingKey: "failed",
  queue: "failed_calculations"
};
```

### Monitoring Points

**For kanaelo_calc_queue**:

- Queue depth (number of pending calculations)
- Message publish rate
- Message processing time
- Failed message count

**For kanaelo_save_queue**:

- Queue depth (number of pending saves)
- Message consumption rate
- Save success rate
- Processing errors

### Health Checks

```javascript
// Check queue health
async function checkQueueHealth(channel) {
  try {
    const calcQueue = await channel.checkQueue("kanaelo_calc_queue");
    const saveQueue = await channel.checkQueue("kanaelo_save_queue");

    return {
      kanaelo_calc_queue: {
        messages: calcQueue.messageCount,
        consumers: calcQueue.consumerCount
      },
      kanaelo_save_queue: {
        messages: saveQueue.messageCount,
        consumers: saveQueue.consumerCount
      }
    };
  } catch (error) {
    console.error("Queue health check failed:", error);
    return { error: error.message };
  }
}
```

## Performance Considerations

### Batch Processing

- CSRankker processes messages in batches of 10-20 players
- HUB can publish multiple calculation requests simultaneously
- Consider rate limiting to avoid overwhelming the system

### Expected Processing Times

- **Individual calculation**: 2-5 seconds per player
- **Batch processing**: 30-60 seconds for 20 players
- **Queue processing**: Depends on queue depth and batch size

### Scaling Considerations

- CSRankker can be scaled horizontally by adding more consumer instances
- Each consumer processes one batch at a time
- Queue depth monitoring helps determine when to scale

## Testing and Development

### Test Message Examples

**Calculation Request**:

```json
{
  "steam_id": "76561198123456789",
  "season_id": "test-season",
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "test-calc-001",
  "metadata": {
    "trigger": "manual_calculation",
    "requested_by": "test-suite"
  }
}
```

**Expected Result**:

```json
{
  "steam_id": "76561198123456789",
  "season_id": "test-season",
  "calculation_result": {
    "kanaelo": 245.5,
    "before_stabilization": 245.5,
    "after_stabilization": 245.5,
    "adjustment_factor": 1.0
  },
  "calculation_details": {
    "cs2_contribution": 85.0,
    "faceit_contribution": 120.0,
    "hours_contribution": 15.0,
    "previous_rating_contribution": 25.5,
    "league_tier_applied": null
  },
  "status": "success",
  "errors": []
}
```

### Mock Queue Setup

For testing, you can use ioredis-mock or similar tools to simulate RabbitMQ queues.

## Security Considerations

- **Authentication**: Use RabbitMQ authentication (username/password)
- **Network Security**: Ensure queues are only accessible within Docker network
- **Message Validation**: Validate all message content before processing
- **Rate Limiting**: Implement rate limiting to prevent abuse

## Support and Troubleshooting

### Common Issues

1. **Queue not found**: Ensure queues are declared before use
2. **Connection failures**: Check RabbitMQ server status and network connectivity
3. **Message format errors**: Validate JSON format and required fields
4. **Processing delays**: Check queue depth and consumer health

### Debugging

- Enable detailed logging for queue operations
- Monitor queue metrics and processing times
- Use RabbitMQ management interface for queue inspection
- Check dead letter queue for failed messages

## Integration Checklist

### HUB Service Implementation

- [ ] Configure RabbitMQ connection with correct credentials
- [ ] Declare both queues with proper configuration
- [ ] Implement message publishing to kanaelo_calc_queue
- [ ] Implement message consumption from kanaelo_save_queue
- [ ] Add error handling and retry logic
- [ ] Implement health checks and monitoring
- [ ] Add logging for audit and debugging
- [ ] Test with sample messages

### CSRankker Integration

- [ ] Queue consumer for kanaelo_calc_queue (CSRankker responsibility)
- [ ] Queue producer for kanaelo_save_queue (CSRankker responsibility)
- [ ] Batch processing optimization (CSRankker responsibility)
- [ ] Error handling and dead letter queue (CSRankker responsibility)

This documentation provides everything the HUB service team needs to integrate with CSRankker through RabbitMQ queues. For questions or issues, please refer to the CSRankker service documentation or contact the development team.
