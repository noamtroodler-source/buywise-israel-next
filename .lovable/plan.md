

# Complete Data Tracking Enhancement Plan

## Overview
This plan addresses all gaps identified in the BuyWise tracking audit to ensure comprehensive data collection for analytics and insights.

---

## Phase 1: Database Schema Updates

### 1.1 Add Missing Property Fields
Add explicit boolean/integer columns for commonly filtered amenities currently buried in the `features[]` array:

```sql
-- Add to properties table
ALTER TABLE properties ADD COLUMN has_balcony boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN has_elevator boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN has_storage boolean DEFAULT false;

-- Create indexes for filter performance
CREATE INDEX idx_properties_balcony ON properties(has_balcony) WHERE has_balcony = true;
CREATE INDEX idx_properties_elevator ON properties(has_elevator) WHERE has_elevator = true;
CREATE INDEX idx_properties_storage ON properties(has_storage) WHERE has_storage = true;
```

### 1.2 Expand Buyer Profile Fields
Add missing preference fields to enable buyer context tracking:

```sql
ALTER TABLE buyer_profiles 
  ADD COLUMN target_cities text[] DEFAULT '{}',
  ADD COLUMN property_type_preferences text[] DEFAULT '{}',
  ADD COLUMN purchase_timeline text CHECK (purchase_timeline IN ('immediate', '1_3_months', '3_6_months', '6_12_months', 'flexible')),
  ADD COLUMN budget_min integer,
  ADD COLUMN budget_max integer;
```

### 1.3 Create Share Events Table
Track all share interactions for viral analytics:

```sql
CREATE TABLE share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('property', 'project', 'area', 'tool')),
  entity_id uuid NOT NULL,
  share_method text NOT NULL CHECK (share_method IN ('copy_link', 'whatsapp', 'telegram', 'native_share')),
  page_path text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users
CREATE POLICY "Anyone can insert share events" ON share_events
  FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read share events" ON share_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Index for analytics queries
CREATE INDEX idx_share_events_entity ON share_events(entity_type, entity_id);
CREATE INDEX idx_share_events_method ON share_events(share_method);
CREATE INDEX idx_share_events_created ON share_events(created_at DESC);
```

---

## Phase 2: Add Missing City Anchors

### 2.1 Insert Pardes Hanna Anchors
Add the three required anchors for the only city missing them:

```sql
-- Get Pardes Hanna city_id first, then insert anchors
INSERT INTO city_anchors (city_id, anchor_type, name, name_he, description, latitude, longitude, icon, display_order)
SELECT 
  id,
  'orientation',
  'Pardes Hanna Train Station',
  'תחנת רכבת פרדס חנה',
  'Central transportation hub connecting to Tel Aviv and Haifa, essential landmark for commuters',
  32.4712,
  34.9698,
  'train',
  1
FROM cities WHERE name ILIKE 'Pardes Hanna%'
UNION ALL
SELECT 
  id,
  'daily_life',
  'Pardes Hanna Market & Town Center',
  'מרכז העיר והשוק',
  'Historic market area and commercial center with local shops, cafes, and community services',
  32.4725,
  34.9650,
  'shopping-bag',
  2
FROM cities WHERE name ILIKE 'Pardes Hanna%'
UNION ALL
SELECT 
  id,
  'mobility',
  'Highway 4 Interchange',
  'מחלף כביש 4',
  'Main highway access point providing quick connections to coastal cities and central Israel',
  32.4680,
  34.9580,
  'car',
  3
FROM cities WHERE name ILIKE 'Pardes Hanna%';
```

---

## Phase 3: Frontend Integration

### 3.1 Share Event Tracking
Update both `ShareButton.tsx` and `ProjectShareButton.tsx` to log share events:

**Files to modify:**
- `src/components/property/ShareButton.tsx`
- `src/components/project/ProjectShareButton.tsx`

**Implementation:**
```typescript
// Add to both share button components
const trackShare = async (method: 'copy_link' | 'whatsapp' | 'telegram') => {
  try {
    await supabase.from('share_events').insert({
      user_id: user?.id || null,
      session_id: getOrCreateSessionId(),
      entity_type: 'property', // or 'project'
      entity_id: propertyId,   // or projectId
      share_method: method,
      page_path: window.location.pathname,
    });
  } catch (error) {
    console.debug('Share tracking error:', error);
  }
};

// Call in each handler
const handleCopyLink = async (e: React.MouseEvent) => {
  // ... existing logic
  trackShare('copy_link');
};
```

### 3.2 Property Form Updates
Add amenity fields to agent listing forms:

**Files to modify:**
- `src/components/agent/listing-form/PropertyFeaturesSection.tsx` (or equivalent)
- `src/hooks/useCreateProperty.ts` (or equivalent mutation)

**Add checkboxes for:**
- Has Balcony
- Has Elevator  
- Has Storage

### 3.3 Buyer Profile Onboarding Enhancement
Add preference collection to onboarding flow:

**Files to modify:**
- `src/components/onboarding/` (relevant step components)
- `src/hooks/useBuyerProfile.tsx`

**New questions to add:**
- "Which cities are you considering?" (multi-select from 25 cities)
- "What property types interest you?" (apartment, house, etc.)
- "What's your timeline?" (immediate → flexible)
- "What's your budget range?" (min/max sliders)

---

## Phase 4: Analytics Dashboard Updates

### 4.1 Share Analytics Widget
Add to admin analytics dashboard:

**File to modify:**
- `src/pages/admin/Analytics.tsx` or create `src/components/admin/analytics/ShareAnalytics.tsx`

**Metrics to display:**
- Total shares by method (pie chart)
- Shares over time (line chart)
- Most shared properties/projects
- Share conversion (share → view by another user)

---

## Summary of Changes

| Category | Item | Action |
|----------|------|--------|
| Database | `properties` table | Add `has_balcony`, `has_elevator`, `has_storage` columns |
| Database | `buyer_profiles` table | Add `target_cities`, `property_type_preferences`, `purchase_timeline`, `budget_min`, `budget_max` |
| Database | `share_events` table | Create new table with RLS |
| Database | `city_anchors` table | Insert 3 anchors for Pardes Hanna |
| Frontend | `ShareButton.tsx` | Add share event tracking |
| Frontend | `ProjectShareButton.tsx` | Add share event tracking |
| Frontend | Listing forms | Add balcony/elevator/storage fields |
| Frontend | Buyer onboarding | Add preference collection steps |
| Admin | Analytics dashboard | Add share analytics widget |

---

## Technical Notes

1. **Session ID**: Reuse the existing `getOrCreateSessionId()` from `useEventTracking.tsx` for share events
2. **RLS Policies**: Share events allow anonymous inserts but restrict reads to admins
3. **Backward Compatibility**: Existing properties will have `false` defaults for new amenity columns
4. **Migration Safety**: All changes are additive (no breaking changes to existing data)

