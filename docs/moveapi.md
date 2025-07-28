# Stats API Endpoints Documentation

This document provides detailed information about the key endpoints in the Stats API, including their functionality, SQL queries, parameters, and return values.

## Authentication

All endpoints require a valid token passed as a query parameter: `?token=YOUR_TOKEN`

## Endpoints

### 1. `/leagues/:seasonId`

**Purpose**: Retrieves all leagues for a specific season.

**URL Pattern**: `GET /leagues/{seasonId}?token={token}`

**Parameters**:

- `seasonId` (path parameter): Integer - The season ID
- `token` (query parameter): String - Authentication token

**SQL Query**:

```sql
SELECT * FROM leagues WHERE season = {seasonId} ORDER BY taso ASC;
```

**Database Tables Used**:

- `leagues` - Contains league information

**Return Data Structure**:

```json
{
  "status": "ok",
  "data": [
    {
      "id": "integer - League ID",
      "name": "string - League name",
      "season": "integer - Season number",
      "taso": "integer - Seasonal level within a season"
    }
  ]
}
```

**Error Responses**:

- `403` - Invalid token
- `500` - Season parameter must be an integer or database error

---

### 2. `/teams/:leagueId`

**Purpose**: Retrieves all teams for a specific league.

**URL Pattern**: `GET /teams/{leagueId}?token={token}`

**Parameters**:

- `leagueId` (path parameter): Integer - The league ID
- `token` (query parameter): String - Authentication token

**SQL Query**:

```sql
SELECT t.id, t.Name, t.leagueID, t.logo
FROM teams t
WHERE leagueID = {leagueId}
ORDER BY t.id ASC;
```

**Database Tables Used**:

- `teams` - Contains team information

**Return Data Structure**:

```json
{
  "status": "ok",
  "data": [
    {
      "id": "integer - Team ID",
      "Name": "string - Team name",
      "leagueID": "integer - League ID",
      "logo": "string - Team logo URL/path"
    }
  ]
}
```

**Error Responses**:

- `403` - Invalid token
- `500` - League ID must be an integer or database error

---

### 3. `/matches/:teamId`

**Purpose**: Retrieves all matches for a specific team (both as team1 and team2).

**URL Pattern**: `GET /matches/{teamId}?token={token}`

**Parameters**:

- `teamId` (path parameter): Integer - The team ID
- `token` (query parameter): String - Authentication token

**SQL Query**:

```sql
SELECT * FROM matches
WHERE team1 = {teamId} OR team2 = {teamId}
ORDER BY id DESC;
```

**Database Tables Used**:

- `matches` - Contains match information

**Return Data Structure**:

```json
{
  "status": "ok",
  "data": [
    {
      "id": "integer - Match ID",
      "team1": "integer - Team 1 ID",
      "team2": "integer - Team 2 ID",
      "team1Score": "integer - Team 1 score",
      "team2Score": "integer - Team 2 score",
      "date": "datetime - Match date",
      "demofile": "string - Demo file path",
      "leagueid": "integer - League ID",
      "type": "integer - Match type"
    }
  ]
}
```

**Error Responses**:

- `403` - Invalid token
- `500` - Team ID must be an integer or database error

---

### 4. `/team/:teamId`

**Purpose**: Retrieves all players for a specific team.

**URL Pattern**: `GET /team/{teamId}?token={token}`

**Parameters**:

- `teamId` (path parameter): Integer - The team ID
- `token` (query parameter): String - Authentication token

**SQL Query**:

```sql
SELECT * FROM players
WHERE teamId = {teamId}
ORDER BY id ASC;
```

**Database Tables Used**:

- `players` - Contains player information

**Return Data Structure**:

```json
{
  "status": "ok",
  "data": [
    {
      "id": "integer - Player ID",
      "name": "string - Player name",
      "steamid": "string - Steam ID",
      "teamId": "integer - Team ID"
    }
  ]
}
```

**Error Responses**:

- `403` - Invalid token
- `500` - Team ID must be an integer or database error

---

### 5. `/player/:playerId`

**Purpose**: Retrieves player statistics for a specific player (hardcoded to season 5).

**URL Pattern**: `GET /player/{playerId}?token={token}`

**Parameters**:

- `playerId` (path parameter): Integer - The Steam ID
- `token` (query parameter): String - Authentication token

**SQL Query**:

```sql
SELECT * FROM playerStats_s5
WHERE steamID = {playerId}
ORDER BY id ASC;
```

**Database Tables Used**:

- `playerStats_s5` - Contains player statistics for season 5

**Return Data Structure**:

```json
{
  "status": "ok",
  "data": [
    {
      "id": "integer - Record ID",
      "steamid": "string - Steam ID",
      "matchid": "integer - Match ID",
      "kills": "integer - Number of kills",
      "deaths": "integer - Number of deaths",
      "adr": "decimal - Average damage per round",
      "kanarating": "decimal - Kana rating"
    }
  ]
}
```

**Error Responses**:

- `403` - Invalid token
- `500` - Steam ID must be an integer or database error

**Note**: This endpoint is hardcoded to season 5. For other seasons, use `/players/{playerIDs}/{season}` endpoint.

---

### 6. `/teams/:teamId/keyplayers`

**Purpose**: Retrieves the top 5 key players for a team based on Kana rating, with comprehensive statistics.

**URL Pattern**: `GET /teams/{teamId}/keyplayers?token={token}`

**Parameters**:

- `teamId` (path parameter): Integer - The team ID
- `token` (query parameter): String - Authentication token

**SQL Query Process**:

1. First query to get the season:

```sql
SELECT season FROM teams t
JOIN leagues l ON t.leagueid = l.id
WHERE t.id = {teamId}
```

2. Second query to get key players:

```sql
SELECT * FROM (
  SELECT p.steamid, p.name,
         COUNT(matchid) as GP,
         ROUND(SUM(kills)/SUM(deaths), 2) as KDR,
         SUM(kills)-SUM(deaths) as KDIFF,
         ROUND(AVG(adr), 1) as ADR,
         ROUND(AVG(kanarating), 2) as KANA
  FROM players p
  JOIN playerStats_s{season} ps ON ps.steamid = p.steamid
  WHERE p.teamId = {teamId}
  GROUP BY p.steamid
  ORDER BY GP DESC
  LIMIT 5
) kp
ORDER BY kp.KANA DESC
```

**Database Tables Used**:

- `teams` - Team information
- `leagues` - League information
- `players` - Player information
- `playerStats_s{season}` - Player statistics for the specific season

**Return Data Structure**:

```json
{
  "status": "ok",
  "data": [
    {
      "steamid": "string - Steam ID",
      "name": "string - Player name",
      "GP": "integer - Games played",
      "KDR": "decimal - Kill/Death ratio",
      "KDIFF": "integer - Kill difference (kills - deaths)",
      "ADR": "decimal - Average damage per round",
      "KANA": "decimal - Kana rating"
    }
  ]
}
```

**Error Responses**:

- `403` - Invalid token
- `500` - Team ID must be an integer or database error

**Notes**:

- Returns top 5 players by games played, then sorted by Kana rating
- Automatically determines the season from the team's league
- Calculates aggregate statistics across all matches for each player

---

## Common Error Responses

All endpoints return the following error structure:

```json
{
  "status": "error",
  "message": "Error description"
}
```

**HTTP Status Codes**:

- `200` - Success
- `403` - Invalid authentication token
- `400` - Invalid parameters
- `500` - Server error or database error

## Database Schema Overview

The API uses the following main tables:

- `leagues` - League information and season mapping
- `teams` - Team information and league association
- `players` - Player information and team association
- `matches` - Match results and team associations
- `playerStats_s{season}` - Player statistics per season
- `ranks` - Player ranking information
- `reservations` - Match scheduling information

## Usage Examples

### Get all leagues for season 8:

```
GET /leagues/8?token=YOUR_TOKEN
```

### Get all teams in league 15:

```
GET /teams/15?token=YOUR_TOKEN
```

### Get all matches for team 42:

```
GET /matches/42?token=YOUR_TOKEN
```

### Get all players in team 42:

```
GET /team/42?token=YOUR_TOKEN
```

### Get player statistics for Steam ID 76561198012345678:

```
GET /player/76561198012345678?token=YOUR_TOKEN
```

### Get key players for team 42:

```
GET /teams/42/keyplayers?token=YOUR_TOKEN
```
