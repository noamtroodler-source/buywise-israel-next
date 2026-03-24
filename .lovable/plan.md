

# Create City Zen Agent Profiles + Redistribute Listings

## Summary
Create 9 new agent profiles for City Zen (update existing Ido Langer), pull headshots from Yad2, write realistic bios, and redistribute 84 listings across all 10 agents via round-robin.

## Agents Found (Yad2 Team Page)

| Agent | Avatar URL (Yad2) | Bio Theme |
|---|---|---|
| **Ido Langer** (existing — update) | `3a9c6066-f2a0-4fbd-8c6f-405d11e01d46.jpeg` | Founder/lead, 10+ yrs Sharon region, new construction specialist |
| **Lior Fridman** (new) | `c5777951-99ff-4034-944e-a50089bb4c8c.jpeg` | Senior agent, luxury apartments, Ir Yamim/Ramat Poleg expert |
| **Barak** (new) | No photo (placeholder) | Residential specialist, Even Yehuda & moshav communities |
| **Roei Malka** (new) | No photo (placeholder) | Young dynamic agent, first-time buyers, Netanya north |
| **Tal Chiyon** (new) | `798abf8a-887c-4651-9f66-c321ffe6d3f8.jpeg` | Investment properties, rental portfolio strategy |
| **Erez Ashkenazi** (new) | `32543cc7-eb64-446d-bb2a-0781cd72d296.jpg` | Veteran agent, Kfar Saba & Hod HaSharon markets |
| **Nitzan Galanter** (new) | `cc3f1187-21cc-4ecd-b5e9-af22089a7ad8.jpeg` | New developments & off-plan projects, coastal Netanya |
| **Elichai Givon** (new) | No photo (placeholder) | Commercial-to-residential transitions, urban renewal |
| **Doron Reuveni** (new) | `4f40bf0a-5d91-4dc5-9483-2b300720beae.jpeg` | Houses & cottages specialist, Sharon communities |
| **Liora Ben Ari** (new) | `0ced5e4b-f2ae-40d1-bd2d-a8182f633f86.jpeg` | Client relations, relocation services, English-speaking |

## Implementation — One-Shot Edge Function: `create-cityzen-agents`

1. **Update existing Ido** agent with full name "Ido Langer", avatar from Yad2, license number, bio, specializations, neighborhoods
2. **Insert 9 new agents** with:
   - `agency_id = '9361592e-c7b8-49a6-9a21-8349b5c40719'`
   - `status = 'active'`, `is_verified = true`
   - `avatar_url` from Yad2 image CDN (6 have photos, 3 use null)
   - `license_number` from Yad2
   - Realistic English bios (3-5 sentences each)
   - `languages`: Hebrew + English for all, French for select agents
   - `specializations` and `neighborhoods_covered` tailored to Sharon/Netanya market
3. **Round-robin redistribute** all 84 listings across 10 agents (~8-9 each)

## Files
1. **New**: `supabase/functions/create-cityzen-agents/index.ts` — one-shot function
2. No frontend changes

## Execution
Deploy, invoke once, verify agents + photos load, delete function.

