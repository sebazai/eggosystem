# CSRankker Integration with Stabilization API: Authentication Guide

## Overview

The Stabilization API now requires API key authentication for all requests. This document provides instructions for the CSRankker team on how to properly authenticate with the Stabilization API.

## Authentication Requirements

The Stabilization API uses API key authentication via the `X-API-KEY` header. All requests from the CSRankker service to the Stabilization API must include this header with the correct API key value.

### Error Response without Authentication

If the API key is missing or invalid, the API will return:

- Status code: `401 Unauthorized`
- Response body: `{ "error": "API key required" }` or `{ "error": "Invalid API key" }`

## How to Obtain an API Key

1. **Contact the Kanaliiga Eggosystem Backend Team** to request an API key for the CSRankker service
2. The team will provide you with an API key value (format: alphanumeric string)
3. This API key should be treated as a sensitive secret and not committed to version control

## Implementation Steps

### 1. Store the API Key

Add the API key to your environment variables:

```env
# CSRankker service .env file
STABILIZATION_API_KEY=your_provided_api_key
```

### 2. Update API Requests

Modify all requests to the Stabilization API to include the `X-API-KEY` header:

```typescript
// Before
async function stabilizeKanaelo(playerId, calculatedValue, season) {
  const response = await fetch("http://backend:3001/api/v1/elo/stabilize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      playerId,
      currentValue: calculatedValue,
      season
    })
  });
  // ...
}

// After
async function stabilizeKanaelo(playerId, calculatedValue, season) {
  const response = await fetch("http://backend:3001/api/v1/elo/stabilize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.STABILIZATION_API_KEY // Include API key in header
    },
    body: JSON.stringify({
      playerId,
      currentValue: calculatedValue,
      season
    })
  });
  // ...
}
```

### 3. Handle Authentication Errors

Update your error handling to properly manage authentication failures:

```typescript
async function stabilizeKanaelo(playerId, calculatedValue, season) {
  try {
    const response = await fetch("http://backend:3001/api/v1/elo/stabilize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.STABILIZATION_API_KEY
      },
      body: JSON.stringify({
        playerId,
        currentValue: calculatedValue,
        season,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "csrankker"
        }
      })
    });

    if (response.status === 401) {
      // Authentication error
      const errorData = await response.json();
      console.error("Authentication error:", errorData.error);
      // Consider alerting or notifying administrators
      return calculatedValue; // Fall back to original value
    }

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
    return calculatedValue; // Fall back to original value
  }
}
```

## Testing Authentication

To verify your integration works correctly, you can test with the following curl command:

```bash
curl -X POST http://backend:3001/api/v1/elo/stabilize \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_provided_api_key" \
  -d '{
    "playerId": "76561198123456789",
    "currentValue": 250,
    "season": "test-season"
  }'
```

A successful response will have a status code of 200 and a JSON body similar to:

```json
{
  "stabilizedValue": 250,
  "confidence": 0.1,
  "adjustmentFactor": 1.0,
  "metadata": {
    "processed": false,
    "timestamp": "2024-01-20T10:30:05Z",
    "method": "no-current-elo"
  }
}
```

## Common Issues

| Issue                   | Solution                                                                |
| ----------------------- | ----------------------------------------------------------------------- |
| Missing API key         | Ensure STABILIZATION_API_KEY is set in your environment variables       |
| 401 Unauthorized        | Verify the API key value is correct and properly included in the header |
| Header case sensitivity | Ensure the header name is exactly `X-API-KEY` (case sensitive)          |

## Support

If you encounter persistent authentication issues, please contact the Kanaliiga Eggosystem Backend Team with the following information:

- Service name (CSRankker)
- Full error response
- Request details (excluding the API key value)
- Timestamp of the failed request

---

**Last Updated**: July 8, 2025  
**Document Version**: 1.0
