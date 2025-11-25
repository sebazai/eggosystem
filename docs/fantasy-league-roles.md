# Fantasy League Player Roles - Analysis & Recommendations

## Overview

This document analyzes the current fantasy league role system, identifies issues, and proposes improvements based on available player statistics and gameplay mechanics.

## Current Role System Analysis

### Available Player Statistics

Based on the `PlayerStats` interface, we have extensive data for each player per match:

**Combat Stats:**

- `kills`, `kills_t`, `kills_ct` - Total/T-side/CT-side kills
- `deaths`, `deaths_t`, `deaths_ct` - Total/T-side/CT-side deaths
- `first_kills`, `first_kills_t`, `first_kills_ct` - Opening kills by side
- `first_deaths`, `first_deaths_t`, `first_deaths_ct` - Opening deaths by side
- `kills_1`, `kills_2`, `kills_3`, `kills_4`, `kills_5` - Round kill distributions
- `awp_kills` - AWP/sniper kills
- `headshots`, `hs_percent` - Headshot statistics

**Support Stats:**

- `assists`, `assists_t`, `assists_ct` - Total/T-side/CT-side assists
- `flash_assists`, `flash_assists_t`, `flash_assists_ct` - Flashbang assists
- `utility_damage`, `utility_damage_t`, `utility_damage_ct` - Grenade damage
- `enemies_flashed`, `mates_flashed` - Flashbang effectiveness
- `trades`, `traded` - Trade kill/death stats

**Clutch & Site Stats:**

- `clutches`, `clutches_won` - Clutch attempts and wins
- `one_v_one_won`, `one_v_one_lost` - 1v1 clutch performance
- `plants`, `defuses` - Bomb site actions
- `trade_attempts`, `trade_opportunities` - Trade situations

**Performance Metrics:**

- `adr`, `adr_t`, `adr_ct` - Average damage per round by side
- `kast` - Kill/Assist/Survive/Trade percentage
- `mvps` - Most Valuable Player stars
- `kana_rating` - Overall performance rating

### Current Roles Implementation

#### Core Roles

| Role              | Current Implementation                 | Issues                               |
| ----------------- | -------------------------------------- | ------------------------------------ |
| **Main AWP**      | +20% bonus for AWP kills               | ✅ Uses specific stat (`awp_kills`)  |
| **Leader**        | +20% multiplier to ALL points          | ✅ Simple but effective              |
| **Support**       | +25% bonus for assists + flash assists | ✅ Uses relevant stats               |
| **Entry Fragger** | +30% bonus for opening kills           | ✅ Uses `first_kills`                |
| **Defender**      | +10% bonus (simplified)                | ❌ No specific CT/defense stats used |

#### Specialist Roles

| Role              | Current Implementation    | Issues                                             |
| ----------------- | ------------------------- | -------------------------------------------------- |
| **HS Machine**    | +25% bonus when HS% > 50% | ✅ Uses `hs_percent` threshold                     |
| **Multi Fragger** | +30% bonus for 3K+ rounds | ✅ Uses `kills_3`, `kills_4`, `kills_5`            |
| **Attacker**      | +10% bonus (simplified)   | ❌ No T-side specific logic                        |
| **Camper**        | +7.5% bonus (simplified)  | ❌ **-10% bonus is actually a PENALTY!**           |
| **Stathunter**    | +15% bonus if K/D > 1.0   | ❌ Uses K/D approximation instead of `kana_rating` |
| **Eco Friendly**  | +15% bonus for kills      | ❌ No eco round detection                          |

#### Meme/Fun Roles

| Role              | Current Implementation                                    | Issues                                 |
| ----------------- | --------------------------------------------------------- | -------------------------------------- |
| **Noob**          | +50% bonus if K/D < 0.8 but positive points               | ✅ Clever underdog mechanic            |
| **Flash Master**  | +30% bonus for flash assists (min 3)                      | ✅ Uses `flash_assists` with threshold |
| **Clutch Player** | +40% bonus for clutches                                   | ✅ Uses `clutches_won`                 |
| **First Blood**   | +35% bonus for first kills, -15% penalty for first deaths | ✅ Uses opening kill stats             |

#### Side-Specialist Roles

| Role                   | Current Implementation    | Issues                                              |
| ---------------------- | ------------------------- | --------------------------------------------------- |
| **T-Side Specialist**  | +12.5% bonus (simplified) | ❌ No T-side specific bonuses                       |
| **CT-Side Specialist** | +12.5% bonus (simplified) | ❌ No CT-side specific bonuses                      |
| **Anchor**             | +10% bonus (simplified)   | ❌ No anchor-specific stats (plants/defuses/trades) |

## Major Issues Identified

### 1. Camper Role is Actually a Penalty

**Current:** `ROLE_MULTIPLIER_CAMPER = 0.075` (+7.5% bonus)
**Issue:** The user correctly identified this as problematic. "Camper" should not be a penalty - camping is a valid strategy in CS2.

### 2. Over-Simplified Roles

Many roles just apply percentage bonuses to total points without using specific stats:

- Defender, Attacker, Camper, T-Specialist, CT-Specialist, Anchor

### 3. Underutilized Rich Statistics

We have extensive T/CT-side specific stats but most roles don't use them.

### 4. Poor Role Balance

Some roles are much more powerful than others due to how they're implemented.

### 5. No Differentiation in Clutch Types

All clutches are treated equally, but 1v1, 1v2, and 1v3+ should have different values.

## Recommended Role Improvements

### Core Roles - Keep Mostly As-Is

| Role              | Recommendation                    | Reasoning                   |
| ----------------- | --------------------------------- | --------------------------- |
| **Main AWP**      | Keep current (+20% AWP kills)     | ✅ Already well-implemented |
| **Leader**        | Keep current (+20% all points)    | ✅ Simple and effective     |
| **Support**       | Keep current (+25% assists)       | ✅ Uses relevant stats      |
| **Entry Fragger** | Keep current (+30% opening kills) | ✅ Uses relevant stats      |
| **Defender**      | Improve to use CT-specific stats  | See below                   |

### Specialist Roles - Major Improvements Needed

| Role              | Current             | Recommended                                | Reasoning                           |
| ----------------- | ------------------- | ------------------------------------------ | ----------------------------------- |
| **HS Machine**    | +25% when HS% > 50% | Keep similar, maybe adjust threshold       | Works well                          |
| **Multi Fragger** | +30% for 3K+ rounds | Keep current                               | Uses specific stats well            |
| **Attacker**      | +10% generic        | **+20% bonus for T-side kills/assists**    | Use `kills_t`, `assists_t`, `adr_t` |
| **Camper**        | +7.5% generic       | **+15% bonus for trades and site defense** | Use `trades`, `defuses`, `kast`     |
| **Stathunter**    | +15% if K/D > 1.0   | **+20% bonus if rating > 1.0**             | Use `kana_rating` directly          |
| **Eco Friendly**  | +15% kills          | **Remove or redesign**                     | No eco round detection possible     |

### Meme/Fun Roles - Mostly Good

| Role              | Current                             | Recommended                       | Reasoning           |
| ----------------- | ----------------------------------- | --------------------------------- | ------------------- |
| **Noob**          | +50% if K/D < 0.8                   | Keep current                      | Clever mechanic     |
| **Flash Master**  | +30% flash assists (min 3)          | Keep current                      | Uses specific stats |
| **Clutch Player** | +40% for all clutches               | **Differentiated clutch bonuses** | See below           |
| **First Blood**   | +35% first kills, -15% first deaths | Keep current                      | Works well          |

### Side-Specialist Roles - Complete Redesign Needed

| Role                   | Current        | Recommended                            | Reasoning                                   |
| ---------------------- | -------------- | -------------------------------------- | ------------------------------------------- |
| **T-Side Specialist**  | +12.5% generic | **+25% bonus for T-side performance**  | Use T-side stats specifically               |
| **CT-Side Specialist** | +12.5% generic | **+25% bonus for CT-side performance** | Use CT-side stats specifically              |
| **Anchor**             | +10% generic   | **+20% bonus for anchor play**         | Use defuses, trades, post-plant performance |

## Detailed Role Redesigns

### 1. Attacker Role

**Current:** +10% generic bonus
**New:** +20% bonus specifically for T-side performance

**Implementation:**

```typescript
const tSideKills = stats.kills_t || 0;
const tSideAssists = stats.assists_t || 0;
const tSideADRBonus = (stats.adr_t || 0) > 80 ? (stats.adr_t - 80) * 0.5 : 0;
roleBonus =
  Math.floor((tSideKills + tSideAssists) * ROLE_MULTIPLIER_ATTACKER) +
  tSideADRBonus;
```

### 2. Camper Role (Fixed)

**Current:** +7.5% generic bonus (actually a penalty)
**New:** +15% bonus for defensive/trade play

**Implementation:**

```typescript
const tradeKills = stats.trades || 0;
const defuses = stats.defuses || 0;
const kastBonus = stats.kast > 75 ? stats.kast - 75 : 0;
roleBonus =
  Math.floor((tradeKills + defuses) * ROLE_MULTIPLIER_CAMPER) + kastBonus;
```

### 3. Defender Role

**Current:** +10% generic bonus
**New:** +15% bonus for CT-side defense

**Implementation:**

```typescript
const ctKills = stats.kills_ct || 0;
const ctAssists = stats.assists_ct || 0;
const defuses = stats.defuses || 0;
roleBonus = Math.floor(
  (ctKills + ctAssists + defuses) * ROLE_MULTIPLIER_DEFENDER
);
```

### 4. Clutch Player Role (Enhanced)

**Current:** +40% for all clutches
**New:** Differentiated bonuses by clutch difficulty

**Implementation:**

```typescript
const clutchesWon = stats.clutches_won || 0;
const oneVOneWon = stats.one_v_one_won || 0;
const oneVTwoPlus = clutchesWon - oneVOneWon; // 1v2, 1v3, 1v4, 1v5

roleBonus = Math.floor(
  oneVOneWon * ROLE_MULTIPLIER_CLUTCH_1V1 +
    oneVTwoPlus * ROLE_MULTIPLIER_CLUTCH_1V2PLUS
);
```

### 5. T-Side Specialist

**Current:** +12.5% generic
**New:** +25% bonus for T-side dominance

**Implementation:**

```typescript
const tSideKills = stats.kills_t || 0;
const tSideAssists = stats.assists_t || 0;
const plants = stats.plants || 0;
const tSideADR = stats.adr_t || 0;

const baseBonus = Math.floor(
  (tSideKills + tSideAssists + plants) * ROLE_MULTIPLIER_T_SPECIALIST
);
const adrBonus = tSideADR > 75 ? Math.floor((tSideADR - 75) * 0.3) : 0;

roleBonus = baseBonus + adrBonus;
```

### 6. CT-Side Specialist

**Current:** +12.5% generic
**New:** +25% bonus for CT-side dominance

**Implementation:**

```typescript
const ctKills = stats.kills_ct || 0;
const ctAssists = stats.assists_ct || 0;
const defuses = stats.defuses || 0;
const ctADR = stats.adr_ct || 0;

const baseBonus = Math.floor(
  (ctKills + ctAssists + defuses) * ROLE_MULTIPLIER_CT_SPECIALIST
);
const adrBonus = ctADR > 75 ? Math.floor((ctADR - 75) * 0.3) : 0;

roleBonus = baseBonus + adrBonus;
```

### 7. Anchor Role

**Current:** +10% generic
**New:** +20% bonus for anchor/defensive positioning

**Implementation:**

```typescript
const defuses = stats.defuses || 0;
const trades = stats.trades || 0;
const ctAssists = stats.assists_ct || 0;
const kast = stats.kast || 0;

const baseBonus = Math.floor(
  (defuses + trades + ctAssists) * ROLE_MULTIPLIER_ANCHOR
);
const kastBonus = kast > 70 ? Math.floor((kast - 70) * 0.2) : 0;

roleBonus = baseBonus + kastBonus;
```

### 8. Stathunter Role (Fixed)

**Current:** +15% if K/D > 1.0
**New:** +20% if rating > 1.0 (using actual performance metric)

**Implementation:**

```typescript
if (stats.kana_rating > 1.0) {
  roleBonus = Math.floor(basePoints * ROLE_MULTIPLIER_STATHUNTER);
}
```

## Role Balance Recommendations

### Power Tiers

1. **High Power:** Leader (+20% all), Noob (+50% underdog), Clutch Player (varies)
2. **Medium Power:** Entry Fragger (+30%), Multi Fragger (+30%), Flash Master (+30%)
3. **Standard Power:** Main AWP (+20%), Support (+25%), HS Machine (+25%)
4. **Low Power:** Most others (+15-20%)

### Suggested Multipliers

```typescript
// High impact roles
const ROLE_MULTIPLIER_LEADER = 0.2;
const ROLE_MULTIPLIER_NOOB = 0.5;
const ROLE_MULTIPLIER_CLUTCH_1V1 = 0.4;
const ROLE_MULTIPLIER_CLUTCH_1V2PLUS = 0.6;

// Medium impact roles
const ROLE_MULTIPLIER_ENTRY_FRAGGER = 0.3;
const ROLE_MULTIPLIER_MULTI_FRAGGER = 0.3;
const ROLE_MULTIPLIER_FLASH_MASTER = 0.3;

// Standard roles
const ROLE_MULTIPLIER_MAIN_AWP = 0.2;
const ROLE_MULTIPLIER_SUPPORT = 0.25;
const ROLE_MULTIPLIER_HS_MACHINE = 0.25;

// Side specialists
const ROLE_MULTIPLIER_ATTACKER = 0.2;
const ROLE_MULTIPLIER_DEFENDER = 0.15;
const ROLE_MULTIPLIER_T_SPECIALIST = 0.25;
const ROLE_MULTIPLIER_CT_SPECIALIST = 0.25;
const ROLE_MULTIPLIER_ANCHOR = 0.2;

// Utility roles
const ROLE_MULTIPLIER_CAMPER = 0.15; // Fixed from penalty to bonus
const ROLE_MULTIPLIER_STATHUNTER = 0.2;
const ROLE_MULTIPLIER_FIRST_BLOOD = 0.35; // First kills
const ROLE_MULTIPLIER_FIRST_BLOOD_PENALTY = 0.15; // First deaths
```

## Implementation Priority

### Phase 1 (Critical Fixes)

1. **Fix Camper role** - Change from penalty to bonus
2. **Improve side-specific roles** - Use T/CT stats properly
3. **Fix Stathunter role** - Use rating instead of K/D approximation

### Phase 2 (Enhancements)

1. **Enhanced clutch differentiation** - Different bonuses for 1v1 vs 1v2+
2. **Better anchor/camper roles** - Use trade and utility stats
3. **Remove or redesign Eco Friendly** - If eco detection isn't possible

### Phase 3 (Advanced Features)

1. **Dynamic role bonuses** - Based on map type (bomb vs hostage)
2. **Role synergies** - Bonus points for complementary role combinations
3. **Seasonal role balancing** - Adjust based on meta changes

## Conclusion

The current role system has good foundations but suffers from over-simplification and some outright errors (like the Camper penalty). By leveraging the rich statistical data available and implementing more specific, gameplay-relevant bonuses, we can create a much more engaging and strategic fantasy league experience.

The key improvements focus on:

- Using actual game statistics instead of generic multipliers
- Fixing the Camper role from penalty to bonus
- Properly implementing T/CT-side specialization
- Differentiating clutch performance by difficulty
- Balancing role power levels appropriately

---

**Last Updated:** 2025-11-25
**Status:** Analysis Complete - Ready for Implementation</contents>
</xai:function_call">...
