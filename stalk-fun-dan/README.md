# Dynamic Token Card System

## Overview
A flexible token display system built for Solana tokens, featuring intelligent data structure handling and consistent UI presentation. The system is designed to work with various data sources and structures while maintaining a unified display format.

## Key Features
- 🔄 Universal Data Handling (works with any token data structure)
- 🎯 Specialized Display Modes (KOTH, Boosted, Trending, DEX)
- 🚀 Smart Data Normalization
- 💫 Consistent UI Across Data Sources

## Quick Start

```tsx
import { UnifiedTokenCard } from './components/UnifiedTokenCard';

// Basic usage
const MyComponent = () => (
  <UnifiedTokenCard
    data={tokenData}
    darkMode={true}
    timeframe="24h"
  />
);
```

## Data Structure Support

The system automatically normalizes data from different sources. Examples of supported structures:

### Standard Structure
```json
{
  "marketCap": 51196.17,
  "volume24h": 608758.12,
  "price": 0.0000511
}
```

### Nested Structure
```json
{
  "stats": {
    "token": {
      "name": "Token Name"
    },
    "24h": {
      "volume": {
        "total": 608758.12
      }
    }
  }
}
```

### Alternative Naming
```json
{
  "market_cap": 51196.17,
  "usd_market_cap": 51196.17,
  "stats_24h": {
    "volume_total": 608758.12
  }
}
```

## Display Modes

### 1. Kings of The Hill (KOTH)
```tsx
<UnifiedTokenCard
  data={kothData}
  isKOTH={true}
  kothRank={1}
/>
```

### 2. Boosted Tokens
```tsx
<UnifiedTokenCard
  data={tokenData}
  isBoosted={true}
/>
```

### 3. Trending Tokens
```tsx
<UnifiedTokenCard
  data={tokenData}
  title="trending"
  timeframe="1m"
/>
```

## Field Mapping Support

The system automatically maps fields across different naming conventions:

- Market Cap: `marketCap`, `market_cap`, `usd_market_cap`
- Volume: `volume24h`, `stats.24h.volume.total`, `stats_24h.volume.total`
- Price Change: `priceChange24h`, `price_change_percent`, `stats.24h.priceChangePercentage`
- Social Links: `twitter`, `socials.twitter`, `stats.token.twitter`

## Advanced Features

### KOL Tracking
Supports Key Opinion Leader tracking data:
```json
{
  "kolTracker": [
    {
      "label": "@trader",
      "txType": "buy",
      "timestamp": "2025-02-08T23:44:30.639Z"
    }
  ]
}
```

### Quick Swap Integration
Built-in support for token swaps:
```tsx
<UnifiedTokenCard
  data={tokenData}
  selectedBot="stalkswap"
  settings={{
    quickSwapPresets: [0.1, 0.5, 1],
    slippage: 1
  }}
/>
```

## Common Use Cases

### 1. With MongoDB
```typescript
// Fetch data from any collection
const data = await collection.findOne({ mint: "..." });
// UnifiedTokenCard will normalize the data structure
<UnifiedTokenCard data={data} />
```

### 2. Multiple Data Sources
```typescript
// Works with data from different sources
const dexData = await dexCollection.findOne({});
const smartPumpData = await smartPumpCollection.findOne({});

// Both will display consistently
<>
  <UnifiedTokenCard data={dexData} />
  <UnifiedTokenCard data={smartPumpData} />
</>
```

### 3. Different Time Frames
```typescript
<UnifiedTokenCard
  data={tokenData}
  timeframe="1h" // Supports 1m, 5m, 15m, 30m, 1h, 24h
/>
```

## Best Practices

1. **Data Fetching**
   - Pass complete data objects
   - Let the component handle normalization
   - Include all available metadata

2. **Display Options**
   - Use appropriate mode flags (isKOTH, isBoosted)
   - Set darkMode based on your theme
   - Provide timeframe for relevant stats

3. **Error Handling**
   - Component handles missing data gracefully
   - Provides fallbacks for missing images
   - Includes loading states
