# Kanaelo Queue Population Feature

## Overview

The Kanaelo Queue Population feature allows administrators to trigger Kanaelo ELO calculations for all players in a selected season. This feature is available in the admin Sortter page and sends player data to the RabbitMQ queue for processing by the CSRankker service.

## Technical Architecture

The feature consists of the following components:

1. **Frontend Button**: Located in the Sortter admin page, this button triggers the queue population process for the currently selected season.

2. **Backend API Endpoint**: An endpoint that retrieves all players for a specified season and publishes their data to the RabbitMQ queue.

3. **RabbitMQ Service**: A service that handles the connection to RabbitMQ and publishes messages to the queue.

4. **CSRankker Service**: An external service that consumes messages from the queue and performs the Kanaelo calculations (not part of this feature).

## API Endpoint

### Populate Kanaelo Queue

```
POST /api/v1/sortter/season/:season_id/populate-kanaelo-queue
```

**Parameters:**

- `season_id` (path parameter): The ID of the season for which to populate the queue

**Response:**

```json
{
  "message": "Successfully added 120 players to the kanaelo calculation queue",
  "season_id": 14,
  "total_players": 120,
  "queued_players": 120,
  "failed_players": 0
}
```

**Error Responses:**

- `400 Bad Request`: Invalid season ID
- `404 Not Found`: No players found for the specified season
- `500 Internal Server Error`: Error connecting to RabbitMQ or other server errors

## Queue Message Format

Each message published to the queue has the following format:

```json
{
  "steam_id": "76561197963921578",
  "season_id": 14,
  "timestamp": "2023-06-15T12:34:56Z",
  "request_id": "calc-req-1623760496-921578",
  "priority": 5,
  "metadata": {
    "trigger": "admin_sortter_page",
    "requested_by": "admin",
    "batch_id": "batch-1623760496"
  }
}
```

## Configuration

The RabbitMQ connection is configured using the following environment variables:

- `RABBITMQ_HOST`: The hostname of the RabbitMQ server
- `RABBITMQ_PORT`: The port of the RabbitMQ server (default: 5672)
- `RABBITMQ_USER`: The username for RabbitMQ authentication
- `RABBITMQ_PASSWORD`: The password for RabbitMQ authentication
- `RABBITMQ_VHOST`: The virtual host to use (default: %2F)

## Usage

1. Navigate to the Sortter page in the admin dashboard
2. Select a season from the dropdown
3. Click the "Populate Kanaelo Queue" button
4. Wait for the confirmation message
5. The CSRankker service will process the queued messages asynchronously

## Error Handling

- If the RabbitMQ server is unavailable, the API will return a 500 error
- If no players are found for the selected season, the API will return a 404 error
- If some players fail to be published to the queue, the response will include the count of failed players

## Testing

The feature includes unit tests for:

- The controller that handles the API endpoint
- The model that retrieves players for a season
- The service that publishes messages to RabbitMQ

## Future Improvements

- Add ability to populate the queue for specific teams or players
- Add progress monitoring for the queue processing
- Add detailed error reporting for failed queue operations
