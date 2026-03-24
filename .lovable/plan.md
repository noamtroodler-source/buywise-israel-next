

# Redistribute JRE Listings Across All 11 Agents

## Summary
Re-distribute all 105 JRE listings evenly across all 11 JRE agents using round-robin assignment (~9-10 listings each).

## Step 1 — One-shot Edge Function: `redistribute-jre-listings`

Query all agents under agency `0eb2a33b`, then query all properties assigned to those agents. Round-robin reassign `agent_id` across the 11 agents so each gets ~9-10 listings.

## Files
1. **New**: `supabase/functions/redistribute-jre-listings/index.ts` — one-shot function
2. Deploy, invoke once, delete after.

