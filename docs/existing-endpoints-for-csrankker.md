# Existing Backend Endpoints for CSRankker Service

## Overview

This document maps the existing backend endpoints that can be used by the CSRankker service for kanaelo calculations. The CSRankker service needs player data, stabilization processing, and health checks as outlined in `hub-api.md`.

**Backend Base URL**: `http://backend:3001/api/v1`

## Available Endpoints

### 1. Player Data Endpoints

#### Basic Player Information

```
GET /api/v1/players/{steamId}
```

**Response**:

```json
{
  "steam_id": "string",
  "nickname": "string",
  "avatar_url": "string",
  "is_private": "boolean"
}
```

#### Latest Season Stats

```
GET /api/v1/players/{steamId}/latest-season-stats
```

**Response**:

```json
{
  "steam_id": "string",
  "nickname": "string",
  "latest_season_id": "number",
  "avg_kana_rating": "number",
  "kpd": "number",
  "adr": "number",
  "level": "number"
}
```

#### Previous Kanaelo Data

```
GET /api/v1/players/{steamId}/oldkanaelo
```

**Response**:

```json
{
  "steam_id": "string",
  "last_played_season_id": "number",
  "kana_elo": "number"
}
```

#### Platform Rank Data

```
GET /api/v1/players/{steamId}/platform/{platform}/rank?season_id={seasonId}
```

**Parameters**:

- `platform`: "faceit" | "cs2" | "esportal"
- `season_id`: Optional season ID

**Response**:

```json
{
  "faceit_level": "number",
  "faceit_elo": "number",
  "faceit_kd": "number",
  "faceit_date": "number"
}
```

#### CS2 Hours Data

```
GET /api/v1/players/{steamId}/app/730/hours?season_id={seasonId}
```

**Response**:

```json
{
  "hours": "number"
}
```

#### CS2 Rank Data

```
GET /api/v1/players/{steamId}/app/730/rank?season_id={seasonId}
```

**Response**:

```json
{
  "cs2_rank": "number"
}
```

### 2. Health Check Endpoints

#### Basic API Status

```
GET /api/v1/
```

**Response**:

```json
{
  "message": "API is running"
}
```

#### Current Time (Health Check)

```
GET /api/v1/now
```

**Response**:

```json
{
  "now": "number"
}
```

### 3. Season Information

#### Active Season for App

```
GET /api/v1/organizer/1/app/730/seasons/active
```

**Response**:

```json
{
  "season_id": "number"
}
```

## Mapping to CSRankker Requirements

### ✅ Available Data (Multiple Endpoints Required)

The CSRankker service can obtain most required data by combining multiple endpoints:

**For Player Data Endpoint Requirements**:

- ✅ `steamId` - Available from all player endpoints
- ✅ `seasonId` - Can be passed as query parameter
- ✅ `cs2Data.premierRank` - From `/players/{steamId}/app/730/rank`
- ✅ `cs2Data.hasRank` - Can be derived from rank response
- ✅ `faceitData.level` - From `/players/{steamId}/platform/faceit/rank`
- ✅ `faceitData.elo` - From `/players/{steamId}/platform/faceit/rank`
- ✅ `faceitData.kdRatio` - From `/players/{steamId}/platform/faceit/rank`
- ✅ `faceitData.hasAccount` - Can be derived from faceit response
- ✅ `hoursData.totalHours` - From `/players/{steamId}/app/730/hours`
- ✅ `previousRatings.previousKanaelo` - From `/players/{steamId}/oldkanaelo`
- ✅ `previousRatings.previousKanarating` - From `/players/{steamId}/latest-season-stats`

### ❌ Missing Endpoints

**1. Consolidated Player Data Endpoint**

```
GET /api/v1/players/{steamId}/season/{seasonId}
```

This would need to be created to aggregate all player data in one call as specified in `hub-api.md`.

**2. Stabilization Endpoint**

```
POST /api/v1/stabilize
```

This endpoint doesn't exist and needs to be implemented for kanaelo stabilization processing.

**3. Comprehensive Health Check**

```
GET /api/v1/health
```

A detailed health check with service status doesn't exist (only basic status available).

## Implementation Strategy

### Option 1: Use Existing Endpoints (Recommended for MVP)

The CSRankker service can use existing endpoints with multiple HTTP calls:

```javascript
// Example implementation
async function getPlayerData(steamId, seasonId) {
  const [basicInfo, seasonStats, oldKanaelo, faceitRank, hours, cs2Rank] =
    await Promise.all([
      fetch(`/api/v1/players/${steamId}`),
      fetch(`/api/v1/players/${steamId}/latest-season-stats`),
      fetch(`/api/v1/players/${steamId}/oldkanaelo`),
      fetch(
        `/api/v1/players/${steamId}/platform/faceit/rank?season_id=${seasonId}`
      ),
      fetch(`/api/v1/players/${steamId}/app/730/hours?season_id=${seasonId}`),
      fetch(`/api/v1/players/${steamId}/app/730/rank?season_id=${seasonId}`)
    ]);

  // Combine responses into hub-api.md format
  return {
    steamId,
    seasonId,
    cs2Data: {
      premierRank: cs2Rank.cs2_rank,
      hasRank: cs2Rank.cs2_rank > 0
    },
    faceitData: {
      level: faceitRank.faceit_level,
      elo: faceitRank.faceit_elo,
      kdRatio: faceitRank.faceit_kd,
      hasAccount: faceitRank.faceit_level > 0
    },
    hoursData: {
      totalHours: hours.hours
    },
    previousRatings: {
      previousKanaelo: oldKanaelo?.kana_elo || null,
      previousKanarating: seasonStats?.avg_kana_rating || null
    }
  };
}
```

### Option 2: Create New Consolidated Endpoints

Add the missing endpoints to exactly match `hub-api.md` requirements:

1. **Consolidated Player Data Endpoint**
2. **Stabilization Endpoint**
3. **Comprehensive Health Check**

## Network Configuration

- **Base URL**: `http://backend:3001/api/v1`
- **Content-Type**: `application/json`
- **Network**: Docker internal networking
- **Authentication**: None required for current endpoints
- **Rate Limiting**: Not currently implemented

## Error Handling

All endpoints return standard HTTP status codes:

- **200**: Success
- **404**: Player/Resource not found
- **400**: Invalid parameters
- **500**: Internal server error

## Performance Considerations

- **Multiple API Calls**: Using existing endpoints requires 4-6 HTTP calls per player
- **Concurrent Requests**: Backend supports concurrent requests
- **Caching**: Some endpoints have caching implemented
- **Batch Processing**: No batch endpoints available currently

## Recommendations

1. **Start with existing endpoints** for MVP implementation
2. **Use Promise.all()** for concurrent requests to minimize latency
3. **Add error handling** for individual endpoint failures
4. **Consider creating consolidated endpoints** for production optimization
5. **Implement the missing stabilization endpoint** when ready for full functionality

## Missing Implementations Needed

1. **POST /api/v1/stabilize** - For kanaelo stabilization processing
2. **GET /api/v1/players/{steamId}/season/{seasonId}** - Optional consolidated endpoint
3. **GET /api/v1/health** - Optional comprehensive health check
