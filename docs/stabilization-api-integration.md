# Stabilization API Integration Guide

## Overview

This document provides integration guidelines for the **Kanaliiga Eggosystem Stabilization API**, designed to stabilize kanaelo values calculated by the CSRankker service. The stabilization service applies statistical adjustments based on historical player performance, league context, and team validation rules.

## API Endpoint

**Base URL**: `http://backend:3001/api/v1`

**Endpoint**: `POST /elo/stabilize`

**Content-Type**: `application/json`

## Authentication

API key authentication is **required** for all requests to the Stabilization API. You must include an `X-API-KEY` header with a valid API key in all requests.

**Request Header**:

```
X-API-KEY: your_api_key_here
```

To obtain an API key for your service, please contact the Kanaliiga Eggosystem Backend Team. For detailed authentication instructions, refer to `/docs/csrankker-stabilization-authentication.md`.

## Request Format

### Request Body

```typescript
interface StabilizationRequest {
  playerId: string; // Steam ID (17 digits)
  currentValue: number; // Calculated kanaelo value (0-400)
  season: string; // Season identifier
  metadata?: {
    // Optional metadata
    timestamp: string; // ISO 8601 timestamp
    source: string; // Source system (e.g., "kanaelo-calc")
  };
}
```

### Example Request

```json
{
  "playerId": "76561198123456789",
  "currentValue": 245.5,
  "season": "2024-spring",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "kanaelo-calc"
  }
}
```

### Field Validation

| Field          | Type   | Required | Validation Rules          |
| -------------- | ------ | -------- | ------------------------- |
| `playerId`     | string | ✅       | Must be 17-digit Steam ID |
| `currentValue` | number | ✅       | Must be between 0 and 400 |
| `season`       | string | ✅       | Non-empty string          |
| `metadata`     | object | ❌       | Optional request metadata |

## Response Format

### Success Response

```typescript
interface StabilizationResponse {
  stabilizedValue: number; // Adjusted kanaelo value (0-400)
  confidence: number; // Confidence level (0.0-1.0)
  adjustmentFactor: number; // Multiplier applied (typically 0.5-2.0)
  metadata: {
    processed: boolean; // Whether stabilization was applied
    timestamp: string; // ISO 8601 processing timestamp
    method: string; // Stabilization method used
  };
}
```

### Example Response

```json
{
  "stabilizedValue": 248.2,
  "confidence": 0.85,
  "adjustmentFactor": 1.011,
  "metadata": {
    "processed": true,
    "timestamp": "2024-01-15T10:30:05Z",
    "method": "kanarating-stabilization"
  }
}
```

### Response Fields Explained

| Field                | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `stabilizedValue`    | Final adjusted kanaelo value to use                        |
| `confidence`         | Algorithm confidence (0.1=low, 0.95=high)                  |
| `adjustmentFactor`   | Ratio of stabilized/original value                         |
| `metadata.processed` | `true` if stabilization applied, `false` if passed through |
| `metadata.method`    | Stabilization method or reason for pass-through            |

## Error Handling

### HTTP Status Codes

| Status  | Description    | Action                      |
| ------- | -------------- | --------------------------- |
| **200** | Success        | Use stabilized value        |
| **400** | Bad Request    | Fix request format          |
| **401** | Unauthorized   | Check API key (if enabled)  |
| **500** | Internal Error | Retry or use original value |

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "Error message describing the issue"
}
```

For validation errors, the error message will contain specific details about which field failed validation and why.

### Common Error Cases

```json
// Missing required field
{
  "error": "currentValue is required"
}

// Invalid Steam ID
{
  "error": "playerId must be a valid 17-digit Steam ID"
}

// Value out of range
{
  "error": "currentValue must be a number between 0 and 400"
}

// Authorization error (if API key auth is enabled)
{
  "error": "Invalid API key"
}
```

### Validation Process

Request validation happens in this order:

1. Content-Type validation (must be application/json)
2. Required fields validation (missing fields return 400)
3. Data type validation (incorrect types return 400)
4. Value constraint validation (e.g., Steam ID format, value ranges)
5. Authorization validation (if enabled)

## Stabilization Logic

### When Stabilization is Applied

The service applies stabilization when:

- ✅ Player has historical kanaelo data
- ✅ Sufficient sample size (≥100 players in similar ELO range)
- ✅ Player has performance data in the current league/season

### When Values Pass Through Unchanged

The service returns the original value when:

- ❌ No current ELO found for player
- ❌ No season/league data available
- ❌ Insufficient sample size for comparison
- ❌ No player rating data found

### Confidence Scoring

| Confidence Range | Interpretation                     |
| ---------------- | ---------------------------------- |
| 0.8 - 0.95       | High confidence, large sample size |
| 0.5 - 0.8        | Medium confidence, adequate data   |
| 0.1 - 0.5        | Low confidence, limited data       |

### Adjustment Factor Guidelines

| Factor Range   | Typical Scenarios           |
| -------------- | --------------------------- |
| 0.7 - 1.3      | Normal adjustments (±30%)   |
| 0.5 - 1.5      | Moderate adjustments (±50%) |
| < 0.5 or > 2.0 | Rare, extreme adjustments   |

## Integration Examples

### Basic Integration

```javascript
async function stabilizeKanaelo(playerId, calculatedValue, season) {
  try {
    const response = await fetch("http://backend:3001/api/v1/elo/stabilize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.STABILIZATION_API_KEY // Required API key
      },
      body: JSON.stringify({
        playerId,
        currentValue: calculatedValue,
        season,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "kanaelo-calc"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Stabilization failed: ${response.status}`
      );
    }

    const result = await response.json();
    return result.stabilizedValue;
  } catch (error) {
    console.error("Stabilization error:", error);
    // Fallback to original value
    return calculatedValue;
  }
}
```

### Batch Processing Example

```javascript
async function stabilizeBatch(players) {
  const results = [];

  // Process in parallel with rate limiting
  const promises = players.map(async (player) => {
    try {
      const stabilized = await stabilizeKanaelo(
        player.steamId,
        player.calculatedElo,
        player.season
      );
      return { ...player, finalElo: stabilized };
    } catch (error) {
      console.warn(
        `Failed to stabilize player ${player.steamId}: ${error.message}`
      );
      return { ...player, finalElo: player.calculatedElo };
    }
  });

  return Promise.all(promises);
}
```

### Error Handling Best Practices

```javascript
async function robustStabilization(playerId, value, season) {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await stabilizeKanaelo(playerId, value, season);
      return {
        success: true,
        value: result,
        attempts: attempt
      };
    } catch (error) {
      // Don't retry on validation errors (400)
      if (
        error.message.includes("Invalid") ||
        error.message.includes("required") ||
        error.message.includes("must be")
      ) {
        return {
          success: false,
          value: value,
          error: error.message,
          retryable: false
        };
      }

      if (attempt === maxRetries) {
        console.error(
          `Stabilization failed after ${maxRetries} attempts:`,
          error
        );
        return {
          success: false,
          value: value, // Use original value
          error: error.message,
          retryable: true
        };
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }
}
```

## Performance Considerations

### Response Times

| Scenario               | Expected Response Time |
| ---------------------- | ---------------------- |
| **Normal Processing**  | 200-500ms              |
| **No Historical Data** | 50-100ms               |
| **High Database Load** | 500ms-2s               |

### Rate Limiting

- **No explicit rate limits** currently implemented
- **Recommended**: Limit to 100 requests/second per service
- **Batch Size**: Process 10-20 players per batch for optimal performance

### Monitoring

Monitor these metrics for healthy integration:

- **Response Time P95**: < 1 second
- **Error Rate**: < 5%
- **Timeout Rate**: < 1%
- **Confidence Score Average**: > 0.6

## Team Validation Features

The stabilization service includes team-level validation:

### Team Flagging Rules

1. **Maximum High Adjustments**: No more than 2 players per team with >30 ELO adjustment
2. **Average Team Jump**: Top 4 players' average adjustment must be within ±30 ELO

### Flag Handling

- Teams exceeding limits are **flagged for manual review**
- Flagged teams are stored in Redis with 30-day expiration
- **Stabilization still proceeds** but flags are logged for investigation

## Troubleshooting

### Common Issues

| Issue                    | Symptoms        | Solution                           |
| ------------------------ | --------------- | ---------------------------------- |
| **Connection Refused**   | Network errors  | Check Docker network configuration |
| **Validation Errors**    | 400 responses   | Verify request format              |
| **Timeouts**             | No response     | Check database connectivity        |
| **Inconsistent Results** | Varying outputs | Check player data consistency      |

### Debug Information

For debugging, examine the response metadata:

```json
{
  "metadata": {
    "processed": false,
    "method": "insufficient-sample-size"
  }
}
```

Common `method` values:

- `kanarating-stabilization` - Normal processing
- `no-current-elo` - Player has no historical data
- `no-season-data` - No performance data for season
- `insufficient-sample-size` - Not enough peer data

### Support Contact

For integration issues or questions:

- **Team**: Kanaliiga Eggosystem Backend Team
- **Documentation**: `/docs/stabilization-hub-requirements.md`
- **API Status**: `GET /api/v1/` (health check)

## Testing

### Test Endpoint

```bash
curl -X POST http://backend:3001/api/v1/elo/stabilize \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key_here" \
  -d '{
    "playerId": "76561198123456789",
    "currentValue": 250,
    "season": "test-season"
  }'
```

### Expected Test Response

```json
{
  "stabilizedValue": 250,
  "confidence": 0.1,
  "adjustmentFactor": 1.0,
  "metadata": {
    "processed": false,
    "timestamp": "2024-01-15T10:30:05Z",
    "method": "no-current-elo"
  }
}
```

## Version History

| Version | Date       | Changes                                                        |
| ------- | ---------- | -------------------------------------------------------------- |
| **1.0** | 2024-01-15 | Initial CSRankker-compatible API                               |
| **1.1** | 2024-01-20 | Improved error handling and standardized error response format |
| **1.2** | 2024-07-08 | Added mandatory API key authentication via X-API-KEY header    |
| **1.3** | TBD        | Batch processing endpoint (planned)                            |

---

**Last Updated**: July 8, 2025  
**API Version**: 1.2  
**Compatibility**: CSRankker v2+ (requires API key)
