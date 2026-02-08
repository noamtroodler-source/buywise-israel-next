
# Featured Highlight: Agent-Selected Standout Feature

## Summary
This feature allows agents to select **one key highlight** for their property listing that will be prominently displayed at the top of the property detail page. This creates a visual "hero feature" that catches buyers' attention immediately.

---

## Best Practice Options for Display Location

Based on the current page layout (from your screenshot), here are the recommended placement options:

### **Recommended: Between Address and Hero Stats Bar**
```
$2,298,630  $17,682/m²                    [Share] [Save]
3 Room apartment in Herzliya
📍 134 HaNassi Street, Nof Yam, Herzliya

┌─────────────────────────────────────────────────────┐
│  ✨ Featured: Private Pool with Sun Deck            │   ← NEW HIGHLIGHT
└─────────────────────────────────────────────────────┘

🛏️ 3+1 Bedrooms  |  🛁 1 Bath  |  📐 130m²  |  🏢 Apartment
```

This placement:
- Immediately visible after reading title/address
- Doesn't interrupt the core property stats flow
- Creates a natural "hook" before diving into details

---

## Visual Design Options

### **Option A: Accent Banner (Recommended)**
A subtle, eye-catching banner with brand styling:
```
┌─────────────────────────────────────────────────────┐
│  ✨  Private Pool with Sun Deck                     │
└─────────────────────────────────────────────────────┘
```
- Background: `bg-gradient-to-r from-primary/10 to-primary/5`
- Border: `border-l-4 border-primary`
- Icon: `Sparkles` or contextual icon (Pool icon for pool, etc.)

### **Option B: Inline Badge (More Subtle)**
A prominent badge inline with location:
```
📍 134 HaNassi Street, Herzliya  [✨ Private Pool]
```

### **Option C: Hero Chip Row**
A dedicated row with the single standout:
```
      ┌────────────────────────────┐
      │ ⭐ Highlight: Private Pool │
      └────────────────────────────┘
```

**Recommendation: Option A** - The accent banner is the most effective because:
1. High visibility without being intrusive
2. Creates visual hierarchy
3. Professional appearance
4. Easy for agents to understand the value

---

## Implementation Plan

### Phase 1: Database Schema
Add a new column to store the featured highlight:

```sql
ALTER TABLE properties 
ADD COLUMN featured_highlight TEXT DEFAULT NULL;
```

This is a simple text field because:
- Agent can enter custom text (e.g., "Massive 40m² Balcony", "Private Rooftop Pool")
- More flexible than predefined options
- Allows specificity ("Ocean View from Every Room" vs just "Sea View")

### Phase 2: Type Definitions

**File: `src/types/database.ts`**
```typescript
// Add to Property interface
featured_highlight: string | null;
```

**File: `src/components/agent/wizard/PropertyWizardContext.tsx`**
```typescript
// Add to PropertyWizardData interface
featured_highlight: string;

// Add to defaultPropertyData
featured_highlight: '',
```

### Phase 3: Agent Wizard Update

**File: `src/components/agent/wizard/steps/StepFeatures.tsx`**

Add a new section at the **top** of the Features step (making it the first thing agents see):

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⭐ Featured Highlight                                              │
│                                                                     │
│  What's the ONE thing that makes this property special?             │
│  This will be prominently displayed at the top of your listing.     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Input: e.g., "Private rooftop terrace with city views"]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  💡 Examples: "Private pool", "Massive 50m² balcony",              │
│     "Fully renovated kitchen", "Sea view from every room"          │
└─────────────────────────────────────────────────────────────────────┘
```

Design notes:
- Use `Star` icon (from lucide-react) for the section header
- Input field with placeholder text showing examples
- Optional: Character limit (e.g., 60 chars) to keep it concise
- Helper text explaining the prominence

### Phase 4: Property Quick Summary Display

**File: `src/components/property/PropertyQuickSummary.tsx`**

Add the featured highlight banner **after the address, before the Hero Stats Bar**:

```tsx
{/* Featured Highlight */}
{property.featured_highlight && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary"
  >
    <Star className="h-4 w-4 text-primary fill-primary" />
    <span className="text-sm font-medium text-foreground">{property.featured_highlight}</span>
  </motion.div>
)}
```

Position: Lines ~283-290 (after the address/location, before the Hero Stats Bar)

### Phase 5: Property Card Consideration (Optional)

The featured highlight could also appear on property cards as a badge, but this may clutter the compact card layout. 

**Recommendation: Don't show on cards initially.** The highlight is most impactful on the detail page where agents want to "close the deal." Cards should stay clean for quick scanning.

### Phase 6: Update Submit Handlers

**File: `src/pages/agent/NewPropertyWizard.tsx`**
Add `featured_highlight` to the submission payload.

**File: `src/pages/agent/EditPropertyWizard.tsx`**
Add `featured_highlight` to both form loading and submission.

### Phase 7: Update StepReview

**File: `src/components/agent/wizard/steps/StepReview.tsx`**
Display the featured highlight in the review step so agents can verify it before submitting.

---

## Predefined Suggestions (Optional Enhancement)

To help agents, provide quick-select suggestions based on their existing data:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Quick picks based on your listing:                                │
│                                                                     │
│  [Private Garden]  [Elevator Access]  [Double Parking]  [Custom]   │
└─────────────────────────────────────────────────────────────────────┘
```

These would be generated from the features they've already selected, making it even easier.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| Database | Add `featured_highlight TEXT` column |
| `src/types/database.ts` | Add to Property interface |
| `src/components/agent/wizard/PropertyWizardContext.tsx` | Add to wizard data |
| `src/components/agent/wizard/steps/StepFeatures.tsx` | Add input section at top |
| `src/components/agent/wizard/steps/StepReview.tsx` | Display in review |
| `src/components/property/PropertyQuickSummary.tsx` | Display banner |
| `src/pages/agent/NewPropertyWizard.tsx` | Include in submit |
| `src/pages/agent/EditPropertyWizard.tsx` | Include in form/submit |
| `supabase/functions/seed-demo-data/index.ts` | Add mock highlights |
| **Total** | **~9 files** |

---

## Example Mock Data Highlights

For demo purposes, properties could have highlights like:
- "Private rooftop terrace with panoramic views"
- "Fully renovated with designer finishes"
- "Direct beach access"
- "Smart home automation throughout"
- "Gourmet chef's kitchen"
- "40m² south-facing balcony"
- "Protected room with sea view"
- "Private swimming pool"

---

## Summary

This feature creates a clear visual hierarchy:
1. **Price/Title** - What is it?
2. **Address** - Where is it?
3. **✨ Featured Highlight** - Why is it special? (NEW)
4. **Hero Stats** - Core specs
5. **Quick Facts** - Secondary details
6. **Amenities** - Full feature list

The agent gets to control the narrative by choosing what buyers see first after the basics.
