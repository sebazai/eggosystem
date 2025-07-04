# Hub API Integration Requirements for CSRankker Service

## Overview

This document defines the requirements for existing hub API endpoints that the CSRankker microservice needs to integrate with. The CSRankker service processes kanaelo calculations by consuming from RabbitMQ (`kanaelo_calc_queue`), calling hub API endpoints for player data, calculating kanaelo ratings, and publishing results to RabbitMQ (`kanaelo_save_queue`).

## Service Architecture Context

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RabbitMQ      │    │   CSRankker     │    │   Hub Backend   │
│                 │    │   Service       │    │   (backend:3001)│
│ kanaelo_calc_   │───▶│                 │───▶│                 │
│ queue           │    │ Queue Consumer  │    │ Player Data API │
│                 │    │                 │    │                 │
│ kanaelo_save_   │◀───│ Result Producer │◀───│ Stabilization   │
│ queue           │    │                 │    │ API             │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Network Configuration

- **Hub API Base URL**: `http://backend:3001`
- **Network**: Docker network communication within eggosystem
- **Authentication**: TBD (if required)
- **Content-Type**: `application/json`

## Required Hub API Endpoints

### 1. Player Data Endpoint

**Endpoint**: `GET /api/players/{steamId}/season/{seasonId}`

**Purpose**: Retrieve player data for kanaelo calculation

**Request Parameters**:

- `steamId` (string): Steam ID from queue message
- `seasonId` (string): Season ID from queue message

**Response Format**:

```json
{
  "steamId": "string",
  "seasonId": "string",
  "cs2Data": {
    "premierRank": "number (0-40000)",
    "rankTier": "number (1-8)",
    "hasRank": "boolean"
  },
  "faceitData": {
    "level": "number (1-10)",
    "elo": "number (100-4000)",
    "kills": "number",
    "deaths": "number",
    "kdRatio": "number",
    "hasAccount": "boolean"
  },
  "hoursData": {
    "totalHours": "number",
    "recentHours": "number",
    "lastActive": "ISO 8601 datetime"
  },
  "previousRatings": {
    "previousKanarating": "number | null",
    "previousKanaelo": "number | null",
    "hasHistory": "boolean"
  },
  "leagueTier": "string | null",
  "metadata": {
    "lastUpdated": "ISO 8601 datetime",
    "dataSource": "string"
  }
}
```

**Error Responses**:

- `404`: Player not found
- `400`: Invalid steamId or seasonId format
- `500`: Internal server error

### 2. Stabilization Endpoint

**Endpoint**: `POST /api/stabilize`

**Purpose**: Submit calculated kanaelo for stabilization processing

**Request Body**:

```json
{
  "steamId": "string",
  "seasonId": "string",
  "calculatedKanaelo": "number",
  "leagueTier": "string | null",
  "metadata": {
    "calculationId": "string",
    "timestamp": "ISO 8601 datetime"
  }
}
```

**Response Format**:

```json
{
  "steamId": "string",
  "seasonId": "string",
  "beforeStabilization": "number",
  "afterStabilization": "number",
  "adjustmentFactor": "number",
  "leagueTierApplied": "string | null",
  "metadata": {
    "processingTime": "number (ms)",
    "timestamp": "ISO 8601 datetime"
  }
}
```

**Error Responses**:

- `400`: Invalid request data
- `422`: Calculation value out of acceptable range
- `500`: Stabilization processing failed

### 3. Health Check Endpoint

**Endpoint**: `GET /api/health`

**Purpose**: Monitor hub API availability for CSRankker service

**Response Format**:

```json
{
  "status": "healthy | degraded | unhealthy",
  "timestamp": "ISO 8601 datetime",
  "services": {
    "database": "healthy | unhealthy",
    "cache": "healthy | unhealthy",
    "external_apis": "healthy | unhealthy"
  }
}
```

## Technical Requirements

### Performance Expectations

- **Player Data Endpoint**: < 200ms average response time
- **Stabilization Endpoint**: < 500ms average response time
- **Health Check**: < 100ms average response time
- **Concurrent Requests**: Support for 50+ concurrent requests (batch processing)

### Rate Limiting

- **Minimum Capacity**: 500 requests per minute
- **Burst Capacity**: 100 requests per 10 seconds
- **Batch Requests**: Support for up to 50 concurrent requests from CSRankker batches
- **Error Response**: `429 Too Many Requests` with retry-after header

### Data Consistency

- **Player Data**: Must be consistent across multiple calls within 5 minutes
- **Stabilization**: Deterministic results for identical inputs
- **Timestamps**: All timestamps in UTC timezone
- **Precision**: Numerical values should maintain precision to 2 decimal places

## CSRankker Integration Pattern

### Batch Processing Flow

1. **Queue Processing**: CSRankker consumes batches from `kanaelo_calc_queue`
2. **Concurrent API Calls**: Multiple player data requests sent in parallel
3. **Calculation Processing**: Kanaelo calculations performed for batch
4. **Stabilization Calls**: Batch stabilization requests sent to hub
5. **Result Publishing**: Results published to `kanaelo_save_queue`

### Error Handling Requirements

- **Timeout Handling**: Hub API should handle timeouts gracefully
- **Retry Logic**: CSRankker will retry failed requests with exponential backoff
- **Partial Failures**: Individual player failures should not affect batch processing
- **Circuit Breaker**: CSRankker may stop calling hub API if error rate exceeds threshold

### Expected Request Patterns

- **Batch Size**: 10-50 player data requests at once
- **Frequency**: Continuous processing based on queue load
- **Peak Load**: Higher request volumes during match completion times
- **Concurrent Connections**: Up to 50 concurrent HTTP connections from CSRankker

## Data Validation Requirements

### Input Validation

- **Steam ID**: Must be valid Steam ID format
- **Season ID**: Must be valid UUID or integer format
- **Kanaelo Values**: Must be within 0-400 range
- **Timestamps**: Must be valid ISO 8601 format

### Output Validation

- **Required Fields**: All documented fields must be present
- **Data Types**: Strict type validation for all fields
- **Range Validation**: Numerical values within expected ranges
- **Null Handling**: Proper handling of null/undefined values

## Security Considerations

### Network Security

- **Docker Network**: Secure communication within eggosystem network
- **No External Access**: Hub API endpoints should only be accessible within Docker network
- **Request Validation**: Validate all incoming requests from CSRankker
- **Rate Limiting**: Protect against potential abuse or misuse

### Authentication (If Required)

- **API Key**: If authentication is needed, use API key in headers
- **Request Signing**: Consider request signing for sensitive operations
- **Token Management**: Support for token refresh if applicable

## Monitoring and Debugging

### Request Logging

- **Request ID**: Include unique request ID for tracking
- **Response Time**: Log response times for performance monitoring
- **Error Tracking**: Detailed error logging for debugging
- **Batch Correlation**: Track related requests from same batch

### Health Monitoring

- **Endpoint Monitoring**: Monitor all endpoint availability
- **Performance Metrics**: Track response times and error rates
- **Capacity Monitoring**: Monitor concurrent request handling
- **Resource Usage**: Track CPU, memory, and database usage

## Implementation Timeline

### Phase 1: Core Endpoints (Immediate)

- Player data endpoint implementation
- Basic error handling and validation
- Health check endpoint

### Phase 2: Stabilization (High Priority)

- Stabilization endpoint implementation
- Batch processing optimization
- Rate limiting implementation

### Phase 3: Optimization (Medium Priority)

- Performance tuning
- Advanced error handling
- Monitoring and metrics

### Phase 4: Production Ready (Low Priority)

- Security hardening
- Load testing validation
- Documentation finalization

## Testing Requirements

### CSRankker Integration Testing

- **Mock Endpoints**: Provide test endpoints for CSRankker development
- **Test Data**: Sample player data for various scenarios
- **Error Scenarios**: Test endpoints that simulate various error conditions
- **Performance Testing**: Validate endpoint performance under load

### Hub API Testing

- **Unit Tests**: Test individual endpoint logic
- **Integration Tests**: Test with actual database and external services
- **Load Tests**: Validate performance under expected CSRankker load
- **Error Handling**: Test various error scenarios and recovery
