

## Plan: Add Anglo Community Tags to Neighborhoods

### Data strategy

Two data sources need updating:

**1. City-level anglo data** — normalize the existing `anglo_presence` column (currently inconsistent: "High", "high", "Moderate", "Medium", "Low") to standardized values, and store the editorial `anglo_note` text.

**2. Neighborhood-level anglo tags** — a static lookup map in code (like the existing `cityHeroImages` pattern). This is editorial data that changes rarely and avoids complex JSONB surgery on `featured_neighborhoods`. The map covers both featured and CBS-only neighborhoods.

### What changes

**A. New file: `src/lib/angloNeighborhoodTags.ts`**

A lookup map: `city_slug → Set<neighborhood_name>` for all 48 tagged neighborhoods. Used during the neighborhood merge in `AreaDetail.tsx` to set `anglo_tag: true` on the `UnifiedNeighborhood` object.

**B. DB updates (via insert tool, not migration)**

- Normalize `anglo_presence` on all 32 cities to one of: `strong`, `moderate`, `limited`, `none`
- Store `anglo_note` in an existing nullable text field or add a new column

Since there's no `anglo_note` column yet, we need a **migration** to add it, then **data updates** via insert tool.

**C. Type update: `UnifiedNeighborhood`**

Add `anglo_tag?: boolean` to the interface in `CityNeighborhoods.tsx`.

**D. UI update: `NeighborhoodCard`**

Show a subtle `🌍 Anglo hub` badge on cards where `anglo_tag` is true. Small, muted badge — not a primary visual element.

**E. Merge logic: `AreaDetail.tsx`**

Import the lookup map. During the `useMemo` that builds `unifiedNeighborhoods`, check each neighborhood name against the map for the current city slug and set `anglo_tag: true`.

**F. Search enhancement**

Allow typing "anglo" in the neighborhood search to filter to only anglo-tagged neighborhoods.

### Files to create/edit

| File | Action |
|------|--------|
| `src/lib/angloNeighborhoodTags.ts` | **Create** — static lookup map |
| `src/components/city/CityNeighborhoods.tsx` | **Edit** — add `anglo_tag` to type, badge to card, search filter |
| `src/pages/AreaDetail.tsx` | **Edit** — import map, enrich during merge |
| DB migration | **Add** `anglo_note` text column to `cities` |
| DB data update | **Normalize** `anglo_presence` + populate `anglo_note` for all 32 cities |

### Anglo tag lookup data (48 neighborhoods across 16 cities)

```text
jerusalem     → German Colony, Baka, Rehavia, Katamon / Katamonim, Talbiyeh, Arnona, Har Nof, Ramot, Sanhedria / Maalot Dafna, Ramat Eshkol, Sha'arei Chesed
tel-aviv      → Old North
raanana       → Neve Zemer, Kikar HaSharon, Old Ra'anana / Central, West Ra'anana
herzliya      → Herzliya Pituach, Nof Yam
modiin        → Buchman, Shikun Bet, Shikun Gimmel, Shikun Vav, Shikun Zayin
netanya       → Ir Yamim, Ramat Poleg, North Netanya, Ramat Shikma
beit-shemesh  → RBS Alef, RBS Gimmel, RBS Dalet, Sheinfeld
haifa         → Ahuza, Denia, Merkaz HaCarmel
efrat         → Zayit, Rimon, Tamar, Dagan, Gefen, Dekel, Te'ena
gush-etzion   → Neve Daniel, Elazar, Alon Shvut, Bat Ayin, Tekoa
maale-adumim  → Mitzpe Nevo
caesarea      → Caesarea (town-wide)
givat-shmuel  → Central Givat Shmuel
givat-zeev    → Givat Ze'ev HaChadasha, Ramat Givat Ze'ev
zichron-yaakov→ Derech Sarah / Hazon Ish / Ramat Tzvi area, HaMoshava
```

The lookup will use **fuzzy substring matching** so "Ahuza" matches "Ahuza / Ramat Golda", "Buchman" matches "Buchman (Moriah)", etc. This handles the gap between CSV names and DB featured_neighborhood names without manual mapping of every variant.

