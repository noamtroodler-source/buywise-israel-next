

## Add Brand Colors to Agency and Agent Pages

Use the existing `useExtractedColor` hook to automatically apply brand colors extracted from agency logos to both the Agency Detail page, Agency listing cards, and Agent Detail pages (via their parent agency's logo).

### Strategy

- **Agency pages**: Extract color from `agency.logo_url` -- agencies have logos, so this works directly
- **Agent pages**: If the agent belongs to an agency, inherit the brand color from the **agency's logo** (not the agent's headshot, which would yield skin tones). Solo agents without an agency keep the default theme colors
- **Agency listing cards** (`/agencies`): Add a subtle 3px left border with the extracted color, matching the pattern used on Professional cards

### Changes

**1. `src/hooks/useAgent.tsx`** -- Add `logo_url` to agency select

The agent query currently fetches `agency:agencies(id, name, slug)`. We need to also fetch `logo_url` so we can extract the brand color from it on the agent detail page.

```text
Before: .select('*, agency:agencies(id, name, slug)')
After:  .select('*, agency:agencies(id, name, slug, logo_url)')
```

Update the `AgentAgency` interface to include `logo_url: string | null`.

**2. `src/pages/AgencyDetail.tsx`** -- Apply brand colors to agency detail page

- Import `useExtractedColor`
- Extract color from `agency.logo_url`
- Apply to the hero card: gradient background, 1.5px accent top bar, colored logo ring
- Tint stat card icons with the accent color instead of generic `text-primary`
- Color the contact buttons (Call, Email) with the accent color

**3. `src/pages/Agencies.tsx`** -- Brand colors on agency listing cards

- Import `useExtractedColor` into the `AgencyCard` component
- Extract color from `agency.logo_url`
- Add a 3px left border with the extracted color (same pattern as `ProfessionalCard`)

**4. `src/pages/AgentDetail.tsx`** -- Agency brand colors on agent profiles

- Import `useExtractedColor`
- Extract color from `agent.agency.logo_url` (only when agent has an agency)
- Apply to the hero card: gradient background, accent top bar
- Tint the WhatsApp/Email buttons with the agency color
- Solo agents (no agency) get no accent treatment -- just default theme styling

### What each page looks like after

**Agency Detail (`/agencies/:slug`)**:
- Bold gradient hero tinted with the agency's logo color
- 1.5px colored top bar on the hero card
- Logo container with colored ring/shadow
- Stat icons use the accent color

**Agency Cards (`/agencies`)**:
- Subtle 3px left border in the agency's brand color
- Everything else unchanged

**Agent Detail (`/agents/:id`)**:
- If agent belongs to an agency: gradient hero + top bar using the agency's brand color
- WhatsApp/Email buttons tinted with the agency color
- If solo agent: no accent styling, default theme

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/useAgent.tsx` | Add `logo_url` to agency select + interface |
| `src/pages/AgencyDetail.tsx` | Apply extracted color to hero, stats, and buttons |
| `src/pages/Agencies.tsx` | Add accent left border to agency cards |
| `src/pages/AgentDetail.tsx` | Apply agency brand color to hero and CTAs |

No new files needed -- reuses the existing `useExtractedColor` hook.
