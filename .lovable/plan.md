

# Property Price Tier System

## Status: Implemented

## What it does

Classifies properties into Standard / Premium / Luxury tiers based on city-wide `sold_transactions` percentiles (33rd/67th). Comparison cards and verdict badges now compare against the same tier, eliminating misleading "overpriced" signals for premium properties.

## Architecture

- **DB Function**: `get_city_price_tiers(city, rooms, months_back)` — returns p33, p67 thresholds + per-tier averages. Minimum 20 transactions gate.
- **Hook**: `usePriceTier(city, rooms, propertyPriceSqm)` — classifies property and returns tier-specific avg price/sqm
- **UI**: Tier badge (Premium=blue, Luxury=amber) in MarketIntelligence header. PropertyValueSnapshot cards compare against tier avg when available.

## Files

- `src/hooks/usePriceTier.ts` — new hook
- `src/components/property/MarketIntelligence.tsx` — tier badge + passes tier avg to PropertyValueSnapshot
- `src/components/property/PropertyValueSnapshot.tsx` — accepts priceTier/tierLabel props, tier-aware labels
- `src/types/soldTransactions.ts` — PriceTier type export
