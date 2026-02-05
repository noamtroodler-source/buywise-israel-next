

# Add Furniture Items Selection for Furnished Properties

## Overview
When an agent selects "Fully Furnished" or "Semi Furnished" in the property wizard, a new section will appear allowing them to specify which furniture/appliances come with the property. This helps buyers/renters understand exactly what's included, especially important for the Israeli market where furnished status varies widely.

## User Experience

**Agent Flow:**
1. Agent selects "Semi Furnished" or "Fully Furnished" from the Furnished Status dropdown
2. A new expandable section appears below with an encouraging message
3. Agent can optionally select from common furniture categories (chips/badges that toggle on/off)
4. The selection is saved with the property and displayed on the listing page

**Visual Design (matching BuyWise standards):**
- Same chip/badge style as existing Property Features selection
- Organized into logical categories (Kitchen, Living, Bedroom, Bathroom, etc.)
- Encouraging hint text: "Help renters know what's included - listings with furniture details get 40% more inquiries"
- Subtle animation when the section appears/disappears

## Technical Implementation

### Step 1: Database Migration
Add a new column to the `properties` table:

```sql
ALTER TABLE properties 
ADD COLUMN furniture_items text[] DEFAULT NULL;
```

This stores an array of furniture item identifiers (e.g., `['refrigerator', 'washing_machine', 'bed_double', 'sofa']`).

### Step 2: Update PropertyWizardContext
Add `furniture_items: string[]` to `PropertyWizardData` interface with a default of `[]`.

### Step 3: Update StepFeatures.tsx
Below the "Furnished Status" dropdown, conditionally render a furniture selection section when `furnished_status` is `'fully'` or `'semi'`:

**Furniture items grouped by room:**

| Category | Items |
|----------|-------|
| Kitchen | Refrigerator, Oven/Stove, Microwave, Dishwasher, Washing Machine, Dryer |
| Living Room | Sofa, TV, Coffee Table, Dining Table + Chairs, Bookshelf |
| Bedroom | Double Bed, Single Bed(s), Wardrobe/Closet, Desk + Chair |
| Bathroom | Bathroom Cabinet, Mirror |
| General | Air Conditioner Units, Curtains/Blinds, Light Fixtures |

**UI pattern:**
- Reuse the same toggleable chip/badge pattern from Property Features
- Primary-tinted background when selected, muted border when not
- Grid layout: 2 columns mobile, 3 columns desktop
- Smooth AnimatePresence transition when section appears

### Step 4: Update Property Submission
Update `NewPropertyWizard.tsx` and `EditPropertyWizard.tsx` to include `furniture_items` in the property creation/update payload.

### Step 5: Display on Property Detail Page
Update `PropertyQuickSummary.tsx` or create a new `PropertyFurnitureItems` component:
- Only show when `furnished_status` is `'fully'` or `'semi'` AND `furniture_items` has items
- Display as a compact badge row under the furnished status
- Use appropriate icons per category (Refrigerator icon, Sofa icon, Bed icon, etc.)

### Step 6: Update useAgentProperties Hook
Ensure the hook includes `furniture_items` in the property insert/update type definitions.

## Files to Modify/Create

| File | Action |
|------|--------|
| Database | Add `furniture_items text[]` column |
| `src/components/agent/wizard/PropertyWizardContext.tsx` | Add `furniture_items` to data interface |
| `src/components/agent/wizard/steps/StepFeatures.tsx` | Add conditional furniture selection UI |
| `src/pages/agent/NewPropertyWizard.tsx` | Include `furniture_items` in submission |
| `src/pages/agent/EditPropertyWizard.tsx` | Include `furniture_items` in edit/load |
| `src/hooks/useAgentProperties.tsx` | Add `furniture_items` to types |
| `src/types/database.ts` | Add `furniture_items` to Property interface |
| `src/components/property/PropertyQuickSummary.tsx` | Display furniture items on listing |

## Design Specifications

**Encouragement text:**
"Let renters know what's included - detailed furniture lists help your listing stand out"

**Section header:**
- Icon: `Armchair` (lucide-react) in primary/10 rounded container
- Title: "What's Included"
- Subtitle (muted): "Select the furniture and appliances that come with this property"

**Selected state:**
- Background: `bg-primary/10`
- Border: `border-primary`
- Text: `text-primary font-medium`

**Unselected state:**
- Border: `border-border`
- Hover: `hover:border-primary/50 hover:bg-muted/50`

