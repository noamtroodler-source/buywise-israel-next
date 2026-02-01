
# Comprehensive Feature Implementation Plan
## BuyWise Israel: Psychological Safety Layer Features

---

## Executive Summary

This plan implements three interconnected features that transform BuyWise Israel from a property platform into a **psychological safety layer** for international buyers. Each feature directly supports the core truth: "BuyWise Israel exists to reduce regret, not to create action."

---

## Feature 1: "Questions to Ask" Per Listing

### Purpose
Empower users with confidence before agent contact by providing contextual, property-specific questions they should ask. This directly addresses the fear of "being taken advantage of" by ensuring buyers know what matters before their first conversation.

### Design Philosophy
- Questions feel like a **trusted friend's advice**, not a checklist
- Contextual to property type, listing status, and visible gaps
- Progressive disclosure: show 3-4 key questions upfront, expand for more
- No action required — just preparation

### Component Structure

**New Component: `PropertyQuestionsToAsk.tsx`**

Location: `src/components/property/PropertyQuestionsToAsk.tsx`

```text
┌─────────────────────────────────────────────────────────┐
│ 💬 Questions to Ask About This Property                 │
│ ─────────────────────────────────────────────────────── │
│ Before speaking with the agent, consider asking:        │
│                                                          │
│ ○ "How long has this been on the market?"                │
│   → Helps gauge negotiation room                         │
│                                                          │
│ ○ "What's included in the vaad bayit?"                   │
│   → ₪380/mo covers: elevator, cleaning, gardening       │
│                                                          │
│ ○ "Are there any pending TAMA38 or pinui-binui plans?"   │
│   → Major construction can affect livability            │
│                                                          │
│ [Show 3 more questions ▾]                                │
│                                                          │
│ ───────────────────────────────────────────────────────  │
│ 📋 Save these questions  │  📧 Email to myself           │
└─────────────────────────────────────────────────────────┘
```

### Question Categories (Database-Driven)

| Category | Trigger Condition | Example Questions |
|----------|------------------|-------------------|
| **Pricing & Negotiation** | Always shown | "Has the price been reduced? How negotiable is it?" |
| **Building & Maintenance** | Vaad bayit present | "What does vaad bayit include? Any special assessments?" |
| **Legal Status** | All properties | "Is the property registered in Tabu or Minhal?" |
| **Construction Risk** | Older buildings (pre-1980) | "Any TAMA38 or pinui-binui plans for this building?" |
| **Rental-Specific** | `listing_status === 'for_rent'` | "Is subletting allowed? What about pets?" |
| **New Construction** | Projects | "What's the payment schedule? Bank guarantee details?" |
| **Missing Information** | Description gaps | "The listing doesn't mention parking — is any available?" |

### Database Schema

**New Table: `property_questions`**

```sql
CREATE TABLE property_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  category TEXT NOT NULL, -- 'pricing', 'building', 'legal', 'rental', 'construction'
  applies_to JSONB, -- {"listing_status": ["for_sale"], "property_type": ["apartment"], "conditions": {"year_built_before": 1980}}
  priority INTEGER DEFAULT 50, -- 1-100, higher = more important
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_questions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read questions" ON property_questions
  FOR SELECT USING (is_active = true);
```

### Implementation Details

**Hook: `usePropertyQuestions.ts`**

```typescript
interface PropertyContext {
  listingStatus: ListingStatus;
  propertyType: PropertyType;
  yearBuilt?: number;
  hasVaadBayit: boolean;
  hasParking: boolean;
  daysOnMarket: number;
  priceReduced: boolean;
  missingFields: string[];
}

function usePropertyQuestions(context: PropertyContext) {
  // Fetch questions from DB, filter by context, sort by priority
  // Return top 6-8 most relevant questions
}
```

**Integration Points:**
- Add below `PropertyDescription` in `PropertyDetail.tsx`
- Add to `ProjectDetail.tsx` with construction-specific questions
- Include in mobile collapsible section pattern

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/property/PropertyQuestionsToAsk.tsx` | Create | Main component |
| `src/hooks/usePropertyQuestions.ts` | Create | Data fetching hook |
| `src/pages/PropertyDetail.tsx` | Modify | Add component after description |
| `src/pages/ProjectDetail.tsx` | Modify | Add construction questions |
| Database migration | Create | `property_questions` table |

---

## Feature 2: "Not Ready?" Alternative CTAs

### Purpose
Transform every action CTA into a **permission to slow down**. This removes shame from inaction and signals that BuyWise is on the buyer's side.

### Design Philosophy
- Every "Contact Agent" button gets a subtle alternative
- Language validates hesitation: "Not ready? That's okay."
- Links to preparation resources, not more listings
- Never pushy, never urgent

### Implementation Pattern

**Pattern A: Paired CTA with Secondary Action**

```text
Current:
┌──────────────────────────┐
│   WhatsApp Agent         │
└──────────────────────────┘

New:
┌──────────────────────────┐
│   WhatsApp Agent         │
└──────────────────────────┘
Not ready? Save for later →
```

**Pattern B: Inline Permission Statement**

```text
Current Mobile Bar:
┌─────────────────────────────────────────┐
│ 💬 WhatsApp Agent                       │
└─────────────────────────────────────────┘

New Mobile Bar:
┌─────────────────────────────────────────┐
│ 💬 WhatsApp Agent                       │
├─────────────────────────────────────────┤
│ Not ready to reach out? Totally fine.   │
│ Save this property and come back later. │
└─────────────────────────────────────────┘
```

### Components to Update

**1. StickyContactCard.tsx (Desktop Sidebar)**

Add after contact buttons:

```tsx
<div className="pt-3 border-t border-border/50 mt-3">
  <p className="text-xs text-muted-foreground text-center mb-2">
    Not ready to reach out?
  </p>
  <div className="flex gap-2">
    <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={onSave}>
      <Heart className="h-3.5 w-3.5 mr-1" />
      Save
    </Button>
    <Button variant="ghost" size="sm" className="flex-1 text-xs" asChild>
      <Link to="/guides/talking-to-professionals">
        <BookOpen className="h-3.5 w-3.5 mr-1" />
        Prepare first
      </Link>
    </Button>
  </div>
</div>
```

**2. MobileContactBar.tsx (Mobile Sticky Footer)**

Add expandable "Not ready?" section:

```tsx
{/* Permission to slow down */}
<Collapsible>
  <CollapsibleTrigger className="w-full text-center py-1.5">
    <span className="text-xs text-muted-foreground">
      Not ready? That's okay ▾
    </span>
  </CollapsibleTrigger>
  <CollapsibleContent className="pt-2 space-y-2">
    <p className="text-xs text-muted-foreground text-center">
      Take your time. There's no rush.
    </p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" onClick={onSave}>
        Save for later
      </Button>
      <Button variant="outline" size="sm" className="flex-1" asChild>
        <Link to="/guides/talking-to-professionals">
          Prepare first
        </Link>
      </Button>
    </div>
  </CollapsibleContent>
</Collapsible>
```

**3. ProjectStickyCard.tsx & ProjectMobileContactBar**

Same pattern with project-specific alternative:

```tsx
<Button variant="ghost" size="sm" asChild>
  <Link to="/guides/new-construction">
    Read the guide first
  </Link>
</Button>
```

**4. FinalCTA.tsx (Homepage)**

Transform from action-oriented to permission-based:

```tsx
// Before
<h2>Ready to start exploring?</h2>
<p>Find properties, understand costs, and move forward with confidence.</p>

// After
<h2>No pressure. No rush.</h2>
<p>Whether you're ready to search or just want to understand the market, we're here when you need us.</p>

<div className="flex gap-3">
  <Button asChild>
    <Link to="/listings">Browse Properties</Link>
  </Button>
  <Button variant="outline" asChild>
    <Link to="/guides/buying-in-israel">Start with the guide</Link>
  </Button>
</div>

<p className="text-sm text-muted-foreground mt-4">
  If you're not ready, that's fine. We'll still be here.
</p>
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/property/StickyContactCard.tsx` | Add "Not ready?" section |
| `src/components/property/MobileContactBar` (within StickyContactCard.tsx) | Add collapsible permission section |
| `src/components/project/ProjectStickyCard.tsx` | Add alternative CTA |
| `src/components/project/index.ts` (ProjectMobileContactBar) | Add permission section |
| `src/components/home/FinalCTA.tsx` | Reframe to permission-based |
| `src/components/project/ProjectAgentCard.tsx` | Add "Not ready?" alternative |

---

## Feature 3: Readiness Check Tool

### Purpose
A reflective tool that helps users understand where they are in their journey, what they still need to learn, and what's actually holding them back. Not a quiz, not a funnel — a **clarity exercise**.

### Design Philosophy
- Validates wherever the user is
- Shows gaps without judgment
- Points to specific resources for each gap
- Explicitly states "Not ready? That's smart."

### Tool Structure

**Location:** `src/components/tools/ReadinessCheckTool.tsx`

**User Flow:**

```text
Step 1: Where are you in your thinking?
┌─────────────────────────────────────────────────────────┐
│ ○ Just curious — exploring from afar                    │
│ ○ Starting to get serious — reading and learning        │
│ ○ Actively searching — looking at specific properties   │
│ ○ Ready to act — ready to contact agents soon           │
└─────────────────────────────────────────────────────────┘

Step 2: Quick confidence check (5 yes/no questions)
- "I understand how purchase tax works in Israel"
- "I know roughly what I can afford"
- "I know what questions to ask an agent"
- "I understand the difference between new and resale"
- "I have a general timeline in mind"

Step 3: Personalized readiness report
┌─────────────────────────────────────────────────────────┐
│ Your Readiness Snapshot                                 │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ Stage: Starting to get serious                          │
│                                                          │
│ ✓ You understand purchase tax                            │
│ ✓ You have a budget in mind                              │
│                                                          │
│ Areas to explore:                                        │
│ → What questions to ask agents  [Read guide]             │
│ → New vs resale differences     [Read guide]             │
│ → Timeline planning             [Use calculator]         │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│ "Taking time to understand is not a delay.               │
│  It's how confident decisions are made."                 │
│                                                          │
│ [Save my snapshot]  [Start again]                        │
└─────────────────────────────────────────────────────────┘
```

### Technical Implementation

**Component: `ReadinessCheckTool.tsx`**

```typescript
interface ReadinessState {
  stage: 'curious' | 'learning' | 'searching' | 'ready';
  confidenceChecks: {
    purchaseTax: boolean;
    affordability: boolean;
    agentQuestions: boolean;
    newVsResale: boolean;
    timeline: boolean;
  };
}

interface ReadinessResult {
  stage: string;
  strengths: string[];
  gaps: { label: string; resource: string; resourceType: 'guide' | 'tool' }[];
  affirmation: string;
}
```

**Tool Layout:**

Integrates with existing `ToolLayout` component for consistency.

**Resource Mapping:**

| Gap | Resource | Type |
|-----|----------|------|
| Purchase tax understanding | `/guides/purchase-tax` | Guide |
| Affordability clarity | `/tools?tool=affordability` | Tool |
| Agent preparation | `/guides/talking-to-professionals` | Guide |
| New vs resale knowledge | `/guides/new-vs-resale` | Guide |
| Timeline planning | `/tools?tool=totalcost` | Tool |

### Integration Points

**1. Add to Tools Page**

```typescript
// In src/pages/Tools.tsx - allTools object
readiness: {
  id: 'readiness',
  label: 'Readiness Check',
  description: "Understand where you are in your journey — and what to focus on next.",
  icon: Compass,
  guidanceHint: 'Start here if you're not sure',
}
```

**2. Add to Navigation Config**

```typescript
// In src/lib/navigationConfig.ts - TOOLS_BY_PHASE
define: {
  title: 'Define What Fits You',
  description: 'Understand your budget and options before you start searching.',
  tools: ['readiness', 'affordability', 'rentvsbuy'] // Add readiness first
}
```

**3. Profile Integration**

- Save readiness snapshot to `buyer_profiles.readiness_snapshot` (new JSONB field)
- Show on profile page as "Your Journey Status"
- Allow re-take to update snapshot

### Database Schema

**Add column to `buyer_profiles`:**

```sql
ALTER TABLE buyer_profiles 
ADD COLUMN readiness_snapshot JSONB DEFAULT NULL;

-- Example stored value:
-- {
--   "stage": "learning",
--   "completed_at": "2025-02-01T...",
--   "confidence_checks": {"purchaseTax": true, "affordability": false, ...},
--   "gaps_identified": ["affordability", "timeline"]
-- }
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/tools/ReadinessCheckTool.tsx` | Create | Main tool component |
| `src/pages/Tools.tsx` | Modify | Add to allTools and toolComponents |
| `src/lib/navigationConfig.ts` | Modify | Add to TOOLS_BY_PHASE |
| `src/hooks/useBuyerProfile.tsx` | Modify | Add readiness_snapshot type |
| `src/components/profile/sections/BuyerProfileSection.tsx` | Modify | Show readiness status |
| Database migration | Create | Add readiness_snapshot column |

---

## Shared Component: PermissionStatement

A reusable component for the "permission to slow down" language used across features.

**Location:** `src/components/shared/PermissionStatement.tsx`

```typescript
interface PermissionStatementProps {
  variant: 'inline' | 'card' | 'subtle';
  message?: string;
  action?: {
    label: string;
    href: string;
  };
}

// Default messages by variant
const defaultMessages = {
  inline: "Not ready to reach out? That's okay.",
  card: "Take your time. There's no rush. We'll be here when you're ready.",
  subtle: "If you're not ready, that's fine.",
};
```

---

## Implementation Phases

### Phase 1: "Not Ready?" CTAs (1-2 days)
Low effort, high impact. Immediately transforms the feel of the entire platform.

**Files:**
- Modify `StickyContactCard.tsx`
- Modify `FinalCTA.tsx`
- Modify `ProjectStickyCard.tsx`
- Create `PermissionStatement.tsx`

### Phase 2: Questions to Ask (3-4 days)
Requires database work but delivers immediate value on every listing.

**Files:**
- Create database migration
- Create `PropertyQuestionsToAsk.tsx`
- Create `usePropertyQuestions.ts`
- Modify `PropertyDetail.tsx`
- Modify `ProjectDetail.tsx`
- Seed initial questions data

### Phase 3: Readiness Check Tool (2-3 days)
New tool that embodies the brand positioning.

**Files:**
- Create `ReadinessCheckTool.tsx`
- Modify `Tools.tsx`
- Modify `navigationConfig.ts`
- Create database migration
- Modify profile components

---

## Design System Alignment

All new components follow existing patterns:

| Pattern | Source |
|---------|--------|
| Card styling | Existing `Card` + `CardContent` from shadcn |
| Icons | Lucide React (already installed) |
| Motion | Framer Motion (already installed) |
| Typography | Tailwind classes matching existing hierarchy |
| Colors | Primary blue for positive states, muted for secondary |
| Tooltips | Existing `GlossaryTooltip` pattern |
| Mobile collapsibles | Existing `MobileCollapsibleSection` pattern |

---

## Success Metrics (Aligned with Manifesto)

These features succeed if:

1. **Return visits increase** — Users come back because they trust the platform
2. **Time on page increases** — Users read and absorb, not bounce
3. **Agent contact timing shifts** — Users contact agents later in their journey, but more confidently
4. **User feedback mentions "clarity"** — Qualitative signal of emotional steadiness

These features explicitly do NOT optimize for:
- Conversion rate (action is not the goal)
- Lead generation (trust comes before conversion)
- Time to first contact (waiting is intelligence)

---

## Technical Considerations

### Database Migrations
All migrations are additive (new tables/columns) and won't affect existing functionality.

### RLS Policies
- `property_questions`: Public read access (no auth required)
- `buyer_profiles.readiness_snapshot`: User-only access (existing RLS covers this)

### Performance
- Questions fetched once per property view, cached via React Query
- Readiness tool is client-side only (no API calls during interaction)
- All new components use existing lazy loading patterns
