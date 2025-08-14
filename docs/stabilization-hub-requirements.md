# Stabilization Service Requirements for Hub Team

## Overview

This document outlines the requirements for implementing a real stabilization service to replace the current stub implementation in the CSRankker v2 queue processing system. The stabilization service is responsible for adjusting calculated kanaelo values based on player history, league tier, and other factors to provide more accurate and stable ratings.

## Current System Architecture

### Queue Processing Flow

```
kanaelo_calc_queue → Hub API (6 endpoints) → Kanaelo Calculation → Stabilization → kanaelo_save_queue
```

### Current Stub Implementation Status

- **Location**: `src/services/stabilizationService.ts`
- **Status**: Stub implementation that passes values through unchanged
- **Behavior**: Returns input value with `adjustmentFactor: 1.0` and `confidence: 1.0`
- **Logging**: All stabilization requests are logged for analysis

## Required API Interface

### Stabilization Request Structure

```typescript
interface StabilizationRequest {
  playerId: string; // Steam ID of the player
  currentValue: number; // Calculated kanaelo value (0-400)
  season: string; // Season ID
  metadata?: {
    timestamp: string; // ISO timestamp
    source: string; // Always "kanaelo-calc"
  };
}
```

### Stabilization Response Structure

```typescript
interface StabilizationResponse {
  stabilizedValue: number; // Adjusted kanaelo value (0-400)
  confidence: number; // Confidence level (0.0-1.0)
  adjustmentFactor: number; // Multiplier applied (0.5-2.0 typical range)
  metadata: {
    processed: boolean; // Whether stabilization was applied
    timestamp: string; // ISO timestamp
    method: string; // Stabilization method used
  };
}
```

## Required Service Methods

### 1. Single Stabilization

```typescript
async stabilize(request: StabilizationRequest): Promise<StabilizationResponse>
```

### 2. Batch Stabilization

```typescript
async stabilizeBatch(requests: StabilizationRequest[]): Promise<StabilizationResponse[]>
```

### 3. Health Check

```typescript
async healthCheck(): Promise<boolean>
```

## Player Data Available for Stabilization

When stabilization is called, the following player data is available from the current calculation:

```typescript
interface PlayerContext {
  // Current calculation data
  steamId: string;
  seasonId: string;

  // Raw player data from hub API
  cs2Rank: number; // CS2 Premier rank
  faceitLevel: number; // Faceit level (1-10)
  faceitElo: number; // Faceit ELO
  faceitKd: number; // Faceit K/D ratio
  hours: number; // CS2 hours played

  // Historical data (if available)
  previousKanarating?: number; // Previous kanarating (0-2 range)
  previousKanaelo?: number; // Previous kanaelo (0-400 range)
  previousSeason?: number; // Previous season number
  leagueTier?: number; // League tier (1-7)

  // Calculated components
  components: {
    trueLevel: number; // Faceit points with K/D multiplier
    mm: number; // CS2 rank points
    hour: number; // Hours played points
    kana: number; // Previous rating points
  };
}
```

## Integration Requirements

### 1. Hub API Endpoint

**Required**: Create a new hub API endpoint for stabilization calls

**Suggested endpoint**: `POST /api/v1/stabilization/calculate`

**Request body**: StabilizationRequest structure
**Response body**: StabilizationResponse structure

### 2. Service Integration

The stabilization service should be integrated into the hub API infrastructure:

- **Authentication**: Use existing hub API authentication
- **Rate limiting**: Apply appropriate rate limits
- **Error handling**: Return proper HTTP status codes
- **Logging**: Log all stabilization requests and responses

### 3. Data Access Requirements

The stabilization service will need access to:

- **Player historical data**: Previous kanaelo values and seasons
- **League tier information**: Player's current league tier
- **Performance trends**: Historical performance patterns
- **Seasonal adjustments**: Season-specific adjustment factors

## Stabilization Logic Requirements

### 1. Core Stabilization Factors

**Historical Performance Consistency**:

- Players with consistent performance should have higher confidence
- Large deviations from historical performance should be stabilized more heavily

**League Tier Consideration**:

- Higher league tiers may require different stabilization approaches
- League tier boundaries should influence adjustment factors

**Seasonal Adjustments**:

- New seasons may require different stabilization coefficients
- Early season calculations may need more aggressive stabilization

**Sample Size Considerations**:

- Players with limited historical data may need more conservative adjustments
- Established players with extensive history can have more aggressive adjustments

### 2. Adjustment Factor Guidelines

**Typical adjustment ranges**:

- **Conservative**: 0.7-1.3 (±30% adjustment)
- **Moderate**: 0.5-1.5 (±50% adjustment)
- **Aggressive**: 0.3-2.0 (±70% adjustment)

**Confidence scoring**:

- **High confidence**: 0.8-1.0 (stable, predictable players)
- **Medium confidence**: 0.5-0.8 (some uncertainty)
- **Low confidence**: 0.1-0.5 (high uncertainty, new players)

## Current Usage Patterns

### Processing Volume

- **Current load**: ~50-100 messages per hour
- **Peak load**: Up to 500 messages per hour (during tournaments)
- **Batch processing**: 1-20 players per batch

### Performance Requirements

- **Response time**: < 500ms for single requests
- **Batch response time**: < 2 seconds for 20 players
- **Availability**: 99.9% uptime during processing hours

## Testing Requirements

### 1. Unit Testing

- Test stabilization logic with various player profiles
- Test edge cases (new players, inactive players, extreme values)
- Test batch processing functionality

### 2. Integration Testing

- Test with real player data from hub API
- Test error handling and fallback scenarios
- Test performance under load

### 3. Validation Testing

- Compare stabilized values against historical performance
- Validate adjustment factors are within expected ranges
- Test confidence scoring accuracy

## Implementation Phases

### Phase 1: Basic Implementation

- Implement core stabilization endpoint
- Basic historical data consideration
- Simple adjustment factor calculation

### Phase 2: Advanced Logic

- League tier integration
- Seasonal adjustment factors
- Performance trend analysis

### Phase 3: Optimization

- Batch processing optimization
- Caching for frequently accessed data
- Performance monitoring and tuning

## Current System Integration

### Queue Message Format

The stabilization response is included in the final queue message:

```typescript
interface KanaeloSaveMessage {
  // ... other fields
  result?: {
    kanaelo: number; // This will be the stabilized value
    // ... other calculation data
    stabilization?: {
      originalValue: number; // Pre-stabilization value
      stabilizedValue: number; // Post-stabilization value
      confidence: number; // Confidence level
      adjustmentFactor: number; // Applied adjustment factor
    };
  };
}
```

### Error Handling

- If stabilization fails, the system will use the original calculated value
- Errors are logged but do not prevent message processing
- Partial failures in batch processing are handled gracefully

## Support and Maintenance

### Monitoring Requirements

- Track stabilization request/response times
- Monitor adjustment factor distributions
- Alert on unusual patterns or errors

### Logging Requirements

- Log all stabilization requests and responses
- Include player ID, original value, stabilized value, and adjustment factors
- Maintain audit trail for debugging and analysis

### Configuration Management

- Adjustment factor limits should be configurable
- Seasonal coefficients should be updatable
- Emergency override capability for disabling stabilization

## Questions for Hub Team

1. **Data Access**: What historical data is available for stabilization logic?
2. **League Tiers**: How are league tiers currently managed in the hub system?
3. **Seasonal Data**: What seasonal adjustment factors should be considered?
4. **Performance Requirements**: Any specific performance or scalability requirements?
5. **Integration Timeline**: What's the target timeline for implementing the real stabilization service?

## Contact Information

For questions about this implementation or the current stub service:

- **Current System**: CSRankker v2 queue processor
- **Integration Point**: `/src/services/stabilizationService.ts`
- **Documentation**: This document and memory-bank files

---

**Note**: The current stub implementation is fully functional and logs all requests. This provides a complete audit trail of what data would be sent to the real stabilization service, making it easy to develop and test the actual implementation.
