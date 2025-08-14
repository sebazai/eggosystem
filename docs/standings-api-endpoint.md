# Standings API

This document describes the new standings API endpoint that replicates the functionality from the old csrankker.js system.

## Endpoint

```
GET /api/v1/standings/:league_id
```

## Description

Fetches league standings from Faceit championship data, calculates team statistics, and returns sorted standings based on points and round difference.

## Parameters

- `league_id` (string, required): The Faceit championship/league ID

## Response Format

```json
{
  "data": [
    {
      "team_name": "Team Name",
      "games_played": 4,
      "maps_won": 3,
      "maps_won_ot": 0,
      "maps_lost": 1,
      "maps_lost_ot": 0,
      "points": 9,
      "rounds_won": 48,
      "rounds_lost": 16,
      "rounds_diff": 32
    }
  ],
  "status": 200
}
```

## Response Fields

- `team_name`: Name of the team
- `games_played`: Total number of games/maps played
- `maps_won`: Regular time map wins
- `maps_won_ot`: Overtime map wins
- `maps_lost`: Regular time map losses
- `maps_lost_ot`: Overtime map losses
- `points`: Total points (3 for win, 2 for OT win, 1 for OT loss, 0 for loss)
- `rounds_won`: Total rounds won
- `rounds_lost`: Total rounds lost
- `rounds_diff`: Round difference (rounds_won - rounds_lost)

## Sorting

Results are sorted by:

1. Points (descending)
2. Round difference (descending)

## Caching

- Match data is cached in Redis for 24 hours
- Failed API calls for known broken matches return hardcoded data

## Environment Variables

- `FACEIT_API_KEY`: Required Faceit API key

## Example Usage

```bash
curl -X GET "http://localhost:8080/api/v1/standings/fe4cb0c3-9934-484c-84d1-662acdb025d4"
```

## Error Responses

```json
{
  "error": "League ID is required",
  "status": 400
}
```

```json
{
  "error": "Internal server error",
  "status": 500
}
```

## Implementation Notes

- Replicates the exact logic from the original csrankker.js `getDivStandings` function
- Includes hardcoded data for known broken Faceit matches
- Uses the same scoring system: 3 points for regular win, 2 for OT win, 1 for OT loss, 0 for loss
- Fetches match data from Faceit championships API
- Processes round statistics to calculate team performance metrics
